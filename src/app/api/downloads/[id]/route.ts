import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Entitlement-gated download.
 * GET /api/downloads/[id]?token=DOWNLOAD_TOKEN
 * `id` is the Purchase id (preferred) or legacy project id with matching token.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "Download token required" },
      { status: 401 }
    );
  }

  const db = await pingDatabase();

  // Demo / offline entitlement — never in production
  if (!db.ok) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }
    if (!token.startsWith("demo_")) {
      return NextResponse.json(
        { error: "Invalid token (database offline)" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      url: null,
      token,
      protected: true,
      demo: true,
      message:
        "Purchase verified in demo mode. Connect Supabase Storage + upload a source ZIP to enable real file delivery.",
    });
  }

  try {
    const prisma = await getPrisma();

    let purchase = await prisma.purchase.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
        downloadToken: token,
        paymentStatus: "COMPLETED",
      },
      include: { project: true },
    });

    // Also allow lookup by token alone if id mismatches remapped project
    if (!purchase) {
      purchase = await prisma.purchase.findFirst({
        where: { downloadToken: token, paymentStatus: "COMPLETED" },
        include: { project: true },
      });
    }

    if (!purchase) {
      return NextResponse.json(
        { error: "Invalid or expired download entitlement" },
        { status: 403 }
      );
    }

    const filePath =
      purchase.project.sourceFile ||
      `projects/${purchase.project.slug}/source.zip`;

    await prisma.project.update({
      where: { id: purchase.projectId },
      data: { downloads: { increment: 1 } },
    });

    try {
      const signed = await getSignedDownloadUrl(filePath, 3600);
      if (signed.url === "#") {
        return NextResponse.json({
          url: null,
          token: purchase.downloadToken,
          purchaseId: purchase.id,
          path: filePath,
          protected: true,
          demo: true,
          message:
            "Add SUPABASE_SERVICE_ROLE_KEY and upload the source file to bucket project-files.",
        });
      }

      return NextResponse.json({
        url: signed.url,
        token: purchase.downloadToken,
        purchaseId: purchase.id,
        expiresIn: signed.expiresIn,
        protected: true,
        demo: false,
      });
    } catch (err) {
      return NextResponse.json({
        url: null,
        token: purchase.downloadToken,
        purchaseId: purchase.id,
        path: filePath,
        protected: true,
        demo: true,
        message:
          err instanceof Error
            ? err.message
            : "File not found in storage — upload source ZIP when listing.",
      });
    }
  } catch (err) {
    console.error("[downloads]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Download failed" },
      { status: 500 }
    );
  }
}
