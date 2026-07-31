import { randomBytes } from "crypto";
import { calculateFees } from "@/lib/stripe";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { demoProjects } from "@/lib/demo-data";
import { ensureAppUser } from "@/lib/users";
import {
  getPendingPayment,
  updatePendingPayment,
} from "@/lib/clickpesa";
import { checkUniversityExclusivity } from "@/lib/university-exclusivity";
import { isProductionRuntime } from "@/lib/production";

export class PurchaseBlockedError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code = "PURCHASE_BLOCKED",
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PurchaseBlockedError";
    this.code = code;
    this.details = details;
  }
}
export type FulfillPurchaseInput = {
  buyerEmail: string;
  buyerName?: string;
  buyerUniversity?: string;
  projectId: string;
  slug: string;
  title: string;
  amount: number;
  paymentGateway: "clickpesa" | "stripe" | "demo";
  paymentReference: string;
  affiliateCode?: string;
  phone?: string;
};

export type FulfilledPurchase = {
  id: string;
  downloadToken: string;
  projectId: string;
  slug: string;
  title: string;
  amount: number;
  sellerName: string;
  paymentStatus: string;
  demo: boolean;
};

/**
 * Persist a completed payment as Purchase + Transaction.
 * Creates buyer/seller/project rows when needed (catalog + demo listings).
 */
export async function fulfillPurchase(
  input: FulfillPurchaseInput
): Promise<FulfilledPurchase> {
  const db = await pingDatabase();
  if (!db.ok) {
    if (isProductionRuntime()) {
      throw new Error("Database unavailable — cannot fulfill purchase");
    }
    // Local demo only — still return a usable entitlement token
    const token = `demo_${randomBytes(12).toString("hex")}`;
    return {
      id: `local_${input.paymentReference}`,
      downloadToken: token,
      projectId: input.projectId,
      slug: input.slug,
      title: input.title,
      amount: input.amount,
      sellerName: "Student Creator",
      paymentStatus: "COMPLETED",
      demo: true,
    };
  }

  const prisma = await getPrisma();
  const email = input.buyerEmail.trim().toLowerCase();
  const fees = calculateFees(input.amount);

  // Idempotent: same payment reference already fulfilled
  const existingByRef = await prisma.purchase.findFirst({
    where: { paymentReference: input.paymentReference },
    include: { project: { include: { seller: true } } },
  });
  if (existingByRef && existingByRef.paymentStatus === "COMPLETED") {
    return {
      id: existingByRef.id,
      downloadToken: existingByRef.downloadToken,
      projectId: existingByRef.projectId,
      slug: existingByRef.project.slug,
      title: existingByRef.project.title,
      amount: existingByRef.amount,
      sellerName: existingByRef.project.seller.name,
      paymentStatus: existingByRef.paymentStatus,
      demo: false,
    };
  }

  const buyerResult = await ensureAppUser({
    email,
    name: input.buyerName,
    clerkId: `local_${email}`,
    minRole: "BUYER",
    university: input.buyerUniversity,
  });
  const buyer = buyerResult.user;
  if (!buyer) {
    throw new Error(buyerResult.error || "Could not resolve buyer");
  }

  let project = await prisma.project.findFirst({
    where: {
      OR: [{ id: input.projectId }, { slug: input.slug }],
    },
    include: { seller: true },
  });

  if (!project) {
    const catalog = demoProjects.find(
      (p) => p.id === input.projectId || p.slug === input.slug
    );
    const sellerEmail = catalog
      ? `${catalog.seller.username}@4ward.sellers`
      : "catalog@4ward.local";

    const sellerResult = await ensureAppUser({
      email: sellerEmail,
      name: catalog?.seller.name || "4ward Catalog",
      clerkId: `seller_${sellerEmail}`,
      username: catalog?.seller.username,
      university: catalog?.seller.university || "University of Dar es Salaam",
      avatar: catalog?.seller.avatar,
      minRole: "SELLER",
      role: "SELLER",
    });
    const seller = sellerResult.user;
    if (!seller) {
      throw new Error(sellerResult.error || "Could not resolve seller");
    }
    // ensure approved catalog sellers
    if (!seller.isApproved) {
      await prisma.user.update({
        where: { id: seller.id },
        data: { isApproved: true, role: "SELLER" },
      });
    }

    const slug =
      catalog?.slug ||
      input.slug ||
      `project-${randomBytes(4).toString("hex")}`;

    try {
      project = await prisma.project.create({
        data: {
          title: catalog?.title || input.title,
          slug,
          description: catalog?.description || input.title,
          shortDescription: catalog?.shortDescription || input.title.slice(0, 140),
          category: (catalog?.category as
            | "WEB_APPLICATIONS"
            | "MOBILE_APPLICATIONS"
            | "ARTIFICIAL_INTELLIGENCE"
            | "CYBERSECURITY"
            | "IOT"
            | "BLOCKCHAIN"
            | "DATA_SCIENCE"
            | "DATABASE_SYSTEMS"
            | "UI_UX_DESIGNS") || "WEB_APPLICATIONS",
          price: catalog?.price ?? input.amount,
          pricingType: input.amount === 0 ? "FREE" : "PAID",
          license: "SOURCE_CODE",
          status: "PUBLISHED",
          coverImage: catalog?.coverImage,
          images: catalog?.images || [],
          demoUrl: catalog?.demoUrl,
          githubRepo: catalog?.githubRepo,
          technologyStack: catalog?.technologyStack || [],
          sourceFile: `projects/${slug}/source.zip`,
          sellerId: seller.id,
          publishedAt: new Date(),
        },
        include: { seller: true },
      });
    } catch {
      project = await prisma.project.findUnique({
        where: { slug },
        include: { seller: true },
      });
    }
  }

  if (!project) {
    throw new Error("Could not resolve project for purchase");
  }

  // Campus exclusivity: one buyer per university per project for 4 months
  const lock = await checkUniversityExclusivity({
    projectId: project.id,
    buyerId: buyer.id,
    buyerUniversity: buyer.university,
    listingType: (project as { listingType?: string }).listingType,
    license: project.license,
  });
  if (!lock.allowed) {
    throw new PurchaseBlockedError(lock.message, lock.code, {
      lockedUntil: "lockedUntil" in lock ? lock.lockedUntil : undefined,
      holderName: "holderName" in lock ? lock.holderName : undefined,
      university: "university" in lock ? lock.university : undefined,
    });
  }

  // Ensure source file path exists for downloads
  if (!project.sourceFile) {
    project = await prisma.project.update({
      where: { id: project.id },
      data: { sourceFile: `projects/${project.slug}/source.zip` },
      include: { seller: true },
    });
  }

  const purchase = await prisma.purchase.upsert({
    where: {
      buyerId_projectId: {
        buyerId: buyer.id,
        projectId: project.id,
      },
    },
    update: {
      amount: input.amount,
      paymentStatus: "COMPLETED",
      paymentGateway: input.paymentGateway,
      paymentReference: input.paymentReference,
      stripeSession:
        input.paymentGateway === "stripe" ? input.paymentReference : undefined,
      affiliateCode: input.affiliateCode || undefined,
    },
    create: {
      buyerId: buyer.id,
      projectId: project.id,
      amount: input.amount,
      paymentStatus: "COMPLETED",
      paymentGateway: input.paymentGateway,
      paymentReference: input.paymentReference,
      stripeSession:
        input.paymentGateway === "stripe" ? input.paymentReference : undefined,
      affiliateCode: input.affiliateCode || undefined,
    },
  });

  // One transaction ledger row per purchase reference
  const existingTx = await prisma.transaction.findFirst({
    where: { purchaseId: purchase.id },
  });
  if (!existingTx) {
    await prisma.transaction.create({
      data: {
        sellerId: project.sellerId,
        amount: input.amount,
        platformFee: fees.platformFee,
        netAmount: fees.netAmount,
        status: "COMPLETED",
        purchaseId: purchase.id,
      },
    });
  } else {
    await prisma.transaction.update({
      where: { id: existingTx.id },
      data: {
        status: "COMPLETED",
        amount: input.amount,
        platformFee: fees.platformFee,
        netAmount: fees.netAmount,
      },
    });
  }

  await prisma.notification
    .create({
      data: {
        userId: buyer.id,
        title: "Purchase confirmed",
        message: `You bought “${project.title}”. Download it from Purchases.`,
        link: "/dashboard/purchases",
      },
    })
    .catch(() => null);

  console.info("[audit] purchase.fulfilled", {
    purchaseId: purchase.id,
    gateway: input.paymentGateway,
    paymentReference: input.paymentReference,
    amount: input.amount,
    buyerId: buyer.id,
    projectId: project.id,
  });

  return {
    id: purchase.id,
    downloadToken: purchase.downloadToken,
    projectId: project.id,
    slug: project.slug,
    title: project.title,
    amount: purchase.amount,
    sellerName: project.seller.name,
    paymentStatus: purchase.paymentStatus,
    demo: false,
  };
}

/** Fulfill a ClickPesa pending order after SUCCESS/SETTLED. */
export async function fulfillClickPesaOrder(
  orderReference: string,
  opts?: { collectedAmount?: number }
) {
  const pending = await getPendingPayment(orderReference);
  if (!pending) {
    return { ok: false as const, error: "Unknown order reference" };
  }

  if (
    opts?.collectedAmount !== undefined &&
    Number.isFinite(opts.collectedAmount)
  ) {
    // Allow 1 TZS rounding tolerance
    if (Math.abs(opts.collectedAmount - pending.amount) > 1) {
      await updatePendingPayment(orderReference, {
        status: "FAILED",
        message: `Amount mismatch: expected ${pending.amount}, got ${opts.collectedAmount}`,
        collectedAmount: opts.collectedAmount,
      });
      return {
        ok: false as const,
        error: "Paid amount does not match order total",
        code: "AMOUNT_MISMATCH",
      };
    }
  }

  const email =
    pending.buyerEmail ||
    `buyer_${pending.phoneNumber.slice(-6)}@4ward.mobile`;

  try {
    const fulfilled = await fulfillPurchase({
      buyerEmail: email,
      buyerName: email.split("@")[0],
      projectId: pending.projectId,
      slug: pending.slug,
      title: pending.title,
      amount: pending.amount,
      paymentGateway: "clickpesa",
      paymentReference: orderReference,
      phone: pending.phoneNumber,
    });

    await updatePendingPayment(orderReference, {
      status: "SUCCESS",
      message: "Fulfilled",
      fulfilledAt: new Date().toISOString(),
      ...(opts?.collectedAmount !== undefined
        ? { collectedAmount: opts.collectedAmount }
        : {}),
    });

    return { ok: true as const, purchase: fulfilled, pending };
  } catch (err) {
    if (err instanceof PurchaseBlockedError) {
      await updatePendingPayment(orderReference, {
        status: "FAILED",
        message: err.message,
      });
      return {
        ok: false as const,
        error: err.message,
        code: err.code,
        details: err.details,
      };
    }
    throw err;
  }
}
