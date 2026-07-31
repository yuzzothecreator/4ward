import { getPrisma, pingDatabase } from "@/lib/prisma";
import { requireStaffActor, writeAdminAudit } from "@/lib/admin-auth";
import {
  hasPermission,
  staffVisibleUsersWhere,
  type AppRole,
} from "@/lib/rbac";
import { jsonSecure, sanitizeText } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/support/overview
 * Customer desk deskboard — Super Admins hidden from non–super-admin staff.
 */
export async function GET(req: Request) {
  const gate = await requireStaffActor(req, {
    permission: "support:access",
  });
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure(
      { error: db.error || "Database unavailable", demo: true },
      { status: 503 }
    );
  }

  try {
    const prisma = await getPrisma();
    const hideOwners = staffVisibleUsersWhere(gate.role);

    const [
      recentUsers,
      recentPurchases,
      openReports,
      reports,
      pendingVerification,
      recentMessages,
      escalations,
    ] = await Promise.all([
      prisma.user.findMany({
        where: hideOwners,
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          university: true,
          isApproved: true,
          createdAt: true,
        },
      }),
      prisma.purchase.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          paymentStatus: true,
          createdAt: true,
          buyer: { select: { name: true, email: true, role: true } },
          project: { select: { title: true, slug: true } },
        },
      }),
      prisma.report.count({
        where: { status: { in: ["OPEN", "REVIEWING"] } },
      }),
      prisma.report.findMany({
        where: { status: { in: ["OPEN", "REVIEWING"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          reporter: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: { select: { title: true, slug: true } },
        },
      }),
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: { action: "support.escalate" },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const filterOwner = <T extends { role?: string }>(row: T) =>
      gate.role === "SUPER_ADMIN" || row.role !== "SUPER_ADMIN";

    return jsonSecure({
      actorRole: gate.role,
      actorEmail: gate.actorEmail,
      counts: {
        openReports,
        pendingVerification,
        openEscalations: escalations.length,
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        role: u.role as AppRole,
        createdAt: u.createdAt.toISOString(),
      })),
      recentPurchases: recentPurchases
        .filter((p) => filterOwner(p.buyer))
        .map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.paymentStatus,
          createdAt: p.createdAt.toISOString(),
          buyerName: p.buyer.name,
          buyerEmail: p.buyer.email,
          projectTitle: p.project.title,
          projectSlug: p.project.slug,
        })),
      reports: reports
        .filter((r) => filterOwner(r.reporter))
        .map((r) => ({
          id: r.id,
          reason: r.reason,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          reporterName: r.reporter.name,
          reporterEmail: r.reporter.email,
          reporterId: r.reporter.id,
          projectTitle: r.project?.title || null,
          projectSlug: r.project?.slug || null,
        })),
      conversations: recentMessages
        .filter(
          (m) => filterOwner(m.sender) && filterOwner(m.receiver)
        )
        .map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          read: m.read,
          sender: {
            id: m.sender.id,
            name: m.sender.name,
            email: m.sender.email,
          },
          receiver: {
            id: m.receiver.id,
            name: m.receiver.name,
            email: m.receiver.email,
          },
        })),
      escalations: escalations.map((e) => ({
        id: e.id,
        action: e.action,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[support.overview]", err);
    return jsonSecure(
      {
        error:
          err instanceof Error ? err.message : "Failed to load support data",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/overview
 * Actions: resolve_report | escalate_to_admin | message_user
 */
export async function POST(req: Request) {
  const gate = await requireStaffActor(req, {
    mutate: true,
    permission: "support:access",
  });
  if (!gate.ok) return gate.response;

  const db = await pingDatabase();
  if (!db.ok) {
    return jsonSecure({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const prisma = await getPrisma();

    if (action === "resolve_report") {
      if (!hasPermission(gate.role, "support:resolve")) {
        return jsonSecure({ error: "Forbidden" }, { status: 403 });
      }
      const reportId = String(body.reportId || "");
      if (!reportId) {
        return jsonSecure({ error: "reportId required" }, { status: 400 });
      }
      const status =
        body.status === "DISMISSED" ? "DISMISSED" : ("RESOLVED" as const);
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: { status },
      });
      await writeAdminAudit({
        userId: gate.actorUserId,
        action: "support.report.resolve",
        entity: "Report",
        entityId: reportId,
        metadata: { status, actorEmail: gate.actorEmail },
        ipAddress: gate.ip,
      });
      return jsonSecure({ success: true, report: { id: updated.id, status } });
    }

    if (action === "escalate_to_admin") {
      if (!hasPermission(gate.role, "support:escalate")) {
        return jsonSecure({ error: "Forbidden" }, { status: 403 });
      }
      const userId = String(body.userId || "");
      const note = sanitizeText(body.note || "", 500);
      if (!userId || note.length < 10) {
        return jsonSecure(
          { error: "userId and note (10+ chars) required" },
          { status: 400 }
        );
      }

      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (!target) {
        return jsonSecure({ error: "User not found" }, { status: 404 });
      }
      if (target.role === "SUPER_ADMIN" && gate.role !== "SUPER_ADMIN") {
        return jsonSecure({ error: "User not found" }, { status: 404 });
      }

      // Notify normal Admins only — never route escalations to Super Admin identity
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length === 0) {
        return jsonSecure(
          {
            error: "No Admin accounts to escalate to",
            hint: "Ask Super Admin to create an Admin role first.",
          },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        ...admins.map((a) =>
          prisma.notification.create({
            data: {
              userId: a.id,
              title: "Customer desk escalation",
              message: `${gate.actorEmail} escalated ${target.email}: ${note}`,
              link: "/dashboard/admin",
            },
          })
        ),
        prisma.notification.create({
          data: {
            userId: target.id,
            title: "Your case was escalated",
            message:
              "Customer desk forwarded your issue to an Admin. You’ll hear back soon.",
            link: "/dashboard/messages",
          },
        }),
      ]);

      await writeAdminAudit({
        userId: gate.actorUserId,
        action: "support.escalate",
        entity: "User",
        entityId: userId,
        metadata: {
          targetEmail: target.email,
          note,
          actorEmail: gate.actorEmail,
          notifiedAdmins: admins.length,
        },
        ipAddress: gate.ip,
      });

      return jsonSecure({
        success: true,
        notifiedAdmins: admins.length,
      });
    }

    if (action === "message_user") {
      if (!hasPermission(gate.role, "support:chat")) {
        return jsonSecure({ error: "Forbidden" }, { status: 403 });
      }
      const receiverId = String(body.receiverId || "");
      const content = sanitizeText(body.content || "", 2000);
      if (!receiverId || content.length < 1) {
        return jsonSecure(
          { error: "receiverId and content required" },
          { status: 400 }
        );
      }

      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });
      if (!receiver) {
        return jsonSecure({ error: "User not found" }, { status: 404 });
      }
      if (receiver.role === "SUPER_ADMIN" && gate.role !== "SUPER_ADMIN") {
        return jsonSecure({ error: "User not found" }, { status: 404 });
      }

      let senderId = gate.actorUserId;
      if (!senderId) {
        const me = await prisma.user.findUnique({
          where: { email: gate.actorEmail },
        });
        senderId = me?.id;
      }
      if (!senderId) {
        return jsonSecure(
          { error: "Could not resolve your staff user id" },
          { status: 400 }
        );
      }

      const msg = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          content,
        },
      });

      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: "Message from Customer desk",
          message: content.slice(0, 120),
          link: "/dashboard/messages",
        },
      });

      await writeAdminAudit({
        userId: gate.actorUserId,
        action: "support.message",
        entity: "Message",
        entityId: msg.id,
        metadata: { receiverId, actorEmail: gate.actorEmail },
        ipAddress: gate.ip,
      });

      return jsonSecure({ success: true, messageId: msg.id });
    }

    return jsonSecure({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[support.action]", err);
    return jsonSecure(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}
