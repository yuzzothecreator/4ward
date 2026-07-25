import { NextResponse } from "next/server";
import { assertApiRole } from "@/lib/auth";
import { isAppRole, type AppRole } from "@/lib/rbac";

/**
 * Admin role assignment endpoint.
 * With Clerk: requires ADMIN. Demo mode: returns success for client-side store updates.
 */
export async function PATCH(req: Request) {
  const gate = await assertApiRole(["ADMIN"]);
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const role = body.role as AppRole;

    if (!userId || !isAppRole(role)) {
      return NextResponse.json(
        { error: "userId and a valid role (BUYER|SELLER|ADMIN) are required" },
        { status: 400 }
      );
    }

    // Clerk/DB sync would land here when production auth is wired.
    console.info("[audit] admin.setRole", {
      userId,
      role,
      by: gate.role,
      demo: gate.demo,
    });

    return NextResponse.json({
      success: true,
      userId,
      role,
      demo: gate.demo,
      message: gate.demo
        ? "Demo mode: apply the role in the admin UI store."
        : "Role update accepted (wire Clerk publicMetadata to persist).",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
