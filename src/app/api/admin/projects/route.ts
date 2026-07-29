import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireAdminActor, writeAdminAudit } from "@/lib/admin-auth";
import { jsonSecure, sanitizeText } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Approve or reject a project listing.
 * PATCH { projectId, status, rejectionReason? }
 */
export async function PATCH(req: Request) {
  const gate = await requireAdminActor(req, { mutate: true });
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const status = body.status as string;
    const allowed = ["APPROVED", "PUBLISHED", "REJECTED", "PENDING_REVIEW"];
    if (!projectId || !allowed.includes(status)) {
      return jsonSecure(
        { error: "projectId and valid status required" },
        { status: 400 }
      );
    }

    const db = await pingDatabase();
    if (!db.ok) {
      return jsonSecure({ error: "Database unavailable" }, { status: 503 });
    }

    const prisma = await getPrisma();
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: status as "APPROVED" | "PUBLISHED" | "REJECTED" | "PENDING_REVIEW",
        rejectionReason:
          status === "REJECTED"
            ? sanitizeText(body.rejectionReason || "Rejected by admin", 300)
            : null,
        publishedAt:
          status === "PUBLISHED" || status === "APPROVED" ? new Date() : undefined,
      },
      include: { seller: { select: { name: true, email: true } } },
    });

    if (status === "APPROVED" || status === "PUBLISHED") {
      await prisma.user.update({
        where: { id: project.sellerId },
        data: { isApproved: true, role: "SELLER" },
      });
    }

    await writeAdminAudit({
      userId: gate.actorUserId,
      action: "admin.project.moderate",
      entity: "Project",
      entityId: projectId,
      metadata: { status, title: project.title },
      ipAddress: gate.ip,
    });

    return jsonSecure({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        sellerName: project.seller.name,
      },
    });
  } catch (err) {
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Moderation failed" },
      { status: 500 }
    );
  }
}
