import { NextResponse } from "next/server";
import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Approve or reject a project listing.
 * PATCH { actorEmail, projectId, status: APPROVED|PUBLISHED|REJECTED, rejectionReason? }
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const actorEmail =
      body.actorEmail ||
      req.headers.get("x-admin-email") ||
      "";
    const gate = await requireAdminActor(actorEmail);
    if (!gate.ok) return gate.response;

    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const status = body.status as string;
    const allowed = ["APPROVED", "PUBLISHED", "REJECTED", "PENDING_REVIEW"];
    if (!projectId || !allowed.includes(status)) {
      return NextResponse.json(
        { error: "projectId and valid status required" },
        { status: 400 }
      );
    }

    const db = await pingDatabase();
    if (!db.ok) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const prisma = await getPrisma();
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: status as "APPROVED" | "PUBLISHED" | "REJECTED" | "PENDING_REVIEW",
        rejectionReason:
          status === "REJECTED"
            ? String(body.rejectionReason || "Rejected by admin")
            : null,
        publishedAt:
          status === "PUBLISHED" || status === "APPROVED" ? new Date() : undefined,
      },
      include: { seller: { select: { name: true, email: true } } },
    });

    // Approving a listing also marks the seller approved
    if (status === "APPROVED" || status === "PUBLISHED") {
      await prisma.user.update({
        where: { id: project.sellerId },
        data: { isApproved: true, role: "SELLER" },
      });
    }

    console.info("[audit] admin.project.moderate", {
      by: gate.actorEmail,
      projectId,
      status,
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        sellerName: project.seller.name,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Moderation failed" },
      { status: 500 }
    );
  }
}
