import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureAppUser } from "@/lib/users";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Resolve the signed-in app user (Clerk or demo email).
 * Demo mode: pass `email` query/body when Clerk is off.
 */
export async function resolveRequestUser(
  req: Request,
  bodyEmail?: string,
  actionLabel = "continue"
) {
  if (clerkEnabled) {
    const { userId } = await auth();
    if (!userId) {
      return {
        error: `Sign in to ${actionLabel}`,
        status: 401 as const,
      };
    }
    const clerkUser = await currentUser();
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ||
      "";
    if (!email) {
      return { error: `Sign in to ${actionLabel}`, status: 401 as const };
    }
    const name =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser?.fullName ||
      email.split("@")[0] ||
      "User";
    const synced = await ensureAppUser({
      email,
      name,
      clerkId: userId,
      avatar: clerkUser?.imageUrl || null,
    });
    if (!synced.user) {
      return {
        error: synced.error || "Could not sync account",
        status: (synced.demo ? 503 : 500) as 503 | 500,
      };
    }
    return { user: synced.user };
  }

  const url = new URL(req.url);
  const email = (bodyEmail || url.searchParams.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { error: "email is required", status: 400 as const };
  }
  const synced = await ensureAppUser({ email, name: email.split("@")[0] });
  if (!synced.user) {
    return {
      error: synced.error || "Could not sync account",
      status: (synced.demo ? 503 : 500) as 503 | 500,
    };
  }
  return { user: synced.user };
}
