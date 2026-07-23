import { NextResponse } from "next/server";
import { getSignedDownloadUrl } from "@/lib/storage";
import { demoProjects } from "@/lib/demo-data";
import { getPrisma, pingDatabase } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = `dl_${id}_${Date.now()}`;

  const demo = demoProjects.find((p) => p.id === id);
  let found = Boolean(demo);

  if (!found) {
    const db = await pingDatabase();
    if (db.ok) {
      try {
        const prisma = await getPrisma();
        const project = await prisma.project.findUnique({ where: { id } });
        found = Boolean(project);
      } catch {
        /* ignore */
      }
    }
  }

  // Allow user-store ids (user_*) in demo without DB row
  if (!found && id.startsWith("user_")) found = true;

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const signed = await getSignedDownloadUrl(`projects/${id}/source.zip`);
    return NextResponse.json({
      url: signed.url === "#" ? null : signed.url,
      token,
      expiresIn: signed.expiresIn,
      protected: true,
      demo: signed.url === "#",
    });
  } catch {
    return NextResponse.json({ token, protected: true, demo: true });
  }
}
