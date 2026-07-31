import { NextResponse } from "next/server";
import { checkUniversityExclusivityForEmail } from "@/lib/university-exclusivity";
import { requireRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/purchases/availability?email=&projectId=&slug=
 * Campus exclusivity: one buyer per university per project for 4 months.
 */
export async function GET(req: Request) {
  const limited = requireRateLimit(req, "purchase-availability", 60, 60_000);
  if (limited) return limited;

  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() || "";
  const projectId = url.searchParams.get("projectId") || undefined;
  const slug = url.searchParams.get("slug") || undefined;
  const university = url.searchParams.get("university") || undefined;

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!projectId && !slug) {
    return NextResponse.json(
      { error: "projectId or slug is required" },
      { status: 400 }
    );
  }

  const result = await checkUniversityExclusivityForEmail({
    email,
    projectId,
    slug,
    university,
  });

  return NextResponse.json({
    ...result,
    months: 4,
  });
}
