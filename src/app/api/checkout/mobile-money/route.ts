import { NextResponse } from "next/server";
import { demoProjects } from "@/lib/demo-data";
import { rateLimit } from "@/lib/rate-limit";
import {
  createOrderReference,
  initiateUssdPush,
  isClickPesaConfigured,
  normalizeTzPhone,
  previewUssdPush,
  savePendingPayment,
} from "@/lib/clickpesa";

export const dynamic = "force-dynamic";

/**
 * Start a ClickPesa USSD-PUSH mobile money collection.
 * Body: { projectId?, slug, phone, title?, price?, amount? }
 */
export async function POST(req: Request) {
  try {
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

    const ip = req.headers.get("x-forwarded-for") || "anon";
    const limited = rateLimit(`clickpesa:${ip}`, 10, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
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

    const title =
      catalogProject?.title ||
      (typeof body.title === "string" ? body.title : "") ||
      "4ward project";
    const projectId =
      catalogProject?.id ||
      (typeof body.projectId === "string" ? body.projectId : "") ||
      `local_${body.slug || "project"}`;
    const slug =
      catalogProject?.slug ||
      (typeof body.slug === "string" ? body.slug : "") ||
      "";
    const amount = Math.round(
      Number(
        catalogProject?.price ??
          body.price ??
          body.amount ??
          0
      )
    );

    if (!slug) {
      return NextResponse.json({ error: "Missing project slug" }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Mobile money is only for paid projects" },
        { status: 400 }
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
    savePendingPayment({
      orderReference,
      projectId,
      slug,
      title,
      amount,
      phoneNumber: phone,
      buyerEmail: typeof body.email === "string" ? body.email : undefined,
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
      message:
        "Approve the USSD prompt on your phone to complete payment.",
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
