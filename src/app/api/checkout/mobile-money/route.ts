import { NextResponse } from "next/server";
import { demoProjects } from "@/lib/demo-data";
import {
  createOrderReference,
  initiateUssdPush,
  isClickPesaConfigured,
  normalizeTzPhone,
  previewUssdPush,
  savePendingPayment,
} from "@/lib/clickpesa";
import { checkUniversityExclusivityForEmail } from "@/lib/university-exclusivity";
import {
  requireRateLimit,
  requireSameOrigin,
  jsonSecure,
} from "@/lib/security";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import {
  assertProductionPaymentsReady,
  isProductionRuntime,
} from "@/lib/production";
import { resolveApiActor } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Start a ClickPesa USSD-PUSH mobile money collection.
 * Price is always taken from the catalog / DB — never trusted from the client.
 */
export async function POST(req: Request) {
  try {
    const prodBlock = assertProductionPaymentsReady();
    if (prodBlock) {
      return jsonSecure({ error: prodBlock }, { status: 503 });
    }

    if (!isClickPesaConfigured()) {
      return NextResponse.json(
        {
          error:
            "ClickPesa is not configured. Add CLICKPESA_CLIENT_ID and CLICKPESA_API_KEY.",
          demo: true,
        },
        { status: 503 }
      );
    }

    const originBlock = requireSameOrigin(req);
    if (originBlock) return originBlock;
    const limited = requireRateLimit(req, "clickpesa", 10, 60_000);
    if (limited) return limited;

    const body = await req.json();
    const actor = await resolveApiActor({
      fallbackEmail: typeof body.email === "string" ? body.email : undefined,
    });
    if (!actor.ok) return actor.response;

    const phone = normalizeTzPhone(String(body.phone || ""));
    if (!phone) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Tanzania mobile number (e.g. 0712 345 678 or 255712345678).",
        },
        { status: 400 }
      );
    }

    const catalogProject =
      demoProjects.find((p) => p.id === body.projectId) ||
      demoProjects.find((p) => p.slug === body.slug);

    let title = catalogProject?.title || "4ward project";
    let projectId = catalogProject?.id || "";
    let slug = catalogProject?.slug || "";
    let amount = catalogProject ? Math.round(catalogProject.price) : NaN;

    const db = await pingDatabase();
    if (db.ok && (body.projectId || body.slug)) {
      const prisma = await getPrisma();
      const row = await prisma.project.findFirst({
        where: {
          OR: [
            body.projectId ? { id: String(body.projectId) } : undefined,
            body.slug ? { slug: String(body.slug) } : undefined,
          ].filter(Boolean) as { id?: string; slug?: string }[],
          status: { in: ["PUBLISHED", "APPROVED"] },
        },
      });
      if (row) {
        projectId = row.id;
        slug = row.slug;
        title = row.title;
        amount = Math.round(row.price);
      } else if (!catalogProject) {
        return NextResponse.json(
          { error: "Project not found or not published" },
          { status: 404 }
        );
      }
    } else if (isProductionRuntime()) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    } else if (!catalogProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!slug || !projectId) {
      return NextResponse.json({ error: "Missing project" }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Mobile money is only for paid projects" },
        { status: 400 }
      );
    }

    const buyerEmail = actor.email;
    const lock = await checkUniversityExclusivityForEmail({
      email: buyerEmail,
      projectId,
      slug,
      university:
        typeof body.university === "string" ? body.university : undefined,
    });
    if (!lock.allowed) {
      return NextResponse.json(
        {
          error: lock.message,
          code: lock.code,
          lockedUntil: "lockedUntil" in lock ? lock.lockedUntil : undefined,
        },
        { status: 409 }
      );
    }

    const orderReference = createOrderReference();

    const preview = await previewUssdPush({
      amount,
      orderReference,
      phoneNumber: phone,
    });

    if (!preview.ok) {
      const message =
        (preview.data as { message?: string })?.message ||
        "Could not preview mobile money payment";
      return NextResponse.json(
        { error: message, details: preview.data },
        { status: preview.status || 400 }
      );
    }

    const available = (preview.data.activeMethods || []).filter(
      (m) => m.status === "AVAILABLE"
    );
    if (available.length === 0) {
      return NextResponse.json(
        {
          error:
            "No mobile money channels available for this number right now. Try another wallet or later.",
          preview: preview.data,
        },
        { status: 400 }
      );
    }

    const initiated = await initiateUssdPush({
      amount,
      orderReference,
      phoneNumber: phone,
    });

    if (!initiated.ok) {
      const message =
        initiated.data.message || "Failed to send USSD push to your phone";
      return NextResponse.json(
        { error: message, details: initiated.data },
        { status: initiated.status || 400 }
      );
    }

    const now = new Date().toISOString();
    await savePendingPayment({
      orderReference,
      projectId,
      slug,
      title,
      amount,
      phoneNumber: phone,
      buyerEmail,
      status: initiated.data.status || "PROCESSING",
      channel: initiated.data.channel,
      clickpesaId: initiated.data.id,
      createdAt: now,
      updatedAt: now,
    });

    console.info("[audit] clickpesa.ussd.initiate", {
      orderReference,
      projectId,
      amount,
      phone: phone.slice(0, 5) + "****",
      channel: initiated.data.channel,
      status: initiated.data.status,
    });

    return NextResponse.json({
      success: true,
      orderReference,
      status: initiated.data.status || "PROCESSING",
      channel: initiated.data.channel,
      amount,
      currency: "TZS",
      phone,
      sender: preview.data.sender,
      activeMethods: available.map((m) => m.name),
      message: "Approve the USSD prompt on your phone to complete payment.",
    });
  } catch (err) {
    console.error("[clickpesa] initiate failed", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Mobile money checkout failed",
      },
      { status: 500 }
    );
  }
}
