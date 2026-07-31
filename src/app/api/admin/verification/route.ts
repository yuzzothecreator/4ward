import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireAdminActor, writeAdminAudit } from "@/lib/admin-auth";
import { jsonSecure, sanitizeText } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/verification — list seller blue-tick requests.
 */
export async function GET(req: Request) {
  const gate = await requireAdminActor(req, { permission: "admin:approvals" });
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { requests: [], demo: true, error: db.error || "Database unavailable" },
      { status: 503 }
    );
  }

  try {
    const prisma = await getPrisma();
    const status = new URL(req.url).searchParams.get("status") || "PENDING";
    const where =
      status === "ALL"
        ? {}
        : { status: status as "PENDING" | "APPROVED" | "REJECTED" };

    const rows = await prisma.verificationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            university: true,
            role: true,
            isApproved: true,
            createdAt: true,
            _count: { select: { projects: true, purchases: true } },
            badges: { select: { badge: true } },
          },
        },
      },
    });

    return jsonSecure({
      requests: rows.map((r) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        evidenceUrl: r.evidenceUrl,
        adminNote: r.adminNote,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
        user: {
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          username: r.user.username,
          university: r.user.university,
          role: r.user.role,
          isApproved: r.user.isApproved,
          projectsCount: r.user._count.projects,
          purchasesCount: r.user._count.purchases,
          verified: r.user.badges.some((b) => b.badge === "VERIFIED_CREATOR"),
          joinedAt: r.user.createdAt.toISOString(),
        },
      })),
      demo: false,
    });
  } catch (err) {
    return jsonSecure(
      {
        requests: [],
        error: err instanceof Error ? err.message : "Failed to load requests",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/verification — approve or reject a blue-tick request.
 * Body: { id, action: "APPROVE" | "REJECT", adminNote? }
 */
export async function PATCH(req: Request) {
  const gate = await requireAdminActor(req, {
    mutate: true,
    permission: "admin:approvals",
  });
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: db.error || "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    const action = body.action === "APPROVE" || body.action === "REJECT" ? body.action : null;
    const adminNote = sanitizeText(body.adminNote || "", 500) || null;

    if (!id || !action) {
      return jsonSecure(
        { error: "id and action (APPROVE|REJECT) are required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const request = await prisma.verificationRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return jsonSecure({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return jsonSecure(
        { error: `Request already ${request.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    if (action === "APPROVE") {
      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.verificationRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            adminNote,
            reviewedBy: gate.actorEmail,
            reviewedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: { isApproved: true, role: "SELLER" },
        });

        await tx.userBadge.upsert({
          where: {
            userId_badge: {
              userId: request.userId,
              badge: "VERIFIED_CREATOR",
            },
          },
          update: {},
          create: {
            userId: request.userId,
            badge: "VERIFIED_CREATOR",
          },
        });

        await tx.notification.create({
          data: {
            userId: request.userId,
            title: "Blue tick approved",
            message:
              "Your seller verification was approved. Your profile now shows a verified badge.",
            link: "/dashboard/verification",
          },
        });

        return row;
      });

      await writeAdminAudit({
        userId: gate.actorUserId,
        action: "verification.approve",
        entity: "VerificationRequest",
        entityId: id,
        ipAddress: gate.ip,
        metadata: { sellerEmail: request.user.email, actorEmail: gate.actorEmail },
      });

      return jsonSecure({ success: true, request: { id: updated.id, status: updated.status } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.verificationRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNote: adminNote || "Not enough evidence for verification.",
          reviewedBy: gate.actorEmail,
          reviewedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: request.userId,
          title: "Verification not approved",
          message:
            adminNote ||
            "Your blue-tick request was not approved. You can update your profile and request again.",
          link: "/dashboard/verification",
        },
      });

      return row;
    });

    await writeAdminAudit({
      userId: gate.actorUserId,
      action: "verification.reject",
      entity: "VerificationRequest",
      entityId: id,
      ipAddress: gate.ip,
      metadata: {
        sellerEmail: request.user.email,
        adminNote,
        actorEmail: gate.actorEmail,
      },
    });

    return jsonSecure({ success: true, request: { id: updated.id, status: updated.status } });
  } catch (err) {
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Failed to update request" },
      { status: 500 }
    );
  }
}
