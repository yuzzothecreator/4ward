import { NextResponse } from "next/server";
import { getSignedDownloadUrl } from "@/lib/storage";
import { demoProjects } from "@/lib/demo-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = demoProjects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // In production: verify purchase ownership + generate signed URL
  const token = `dl_${id}_${Date.now()}`;
  try {
    const signed = await getSignedDownloadUrl(`projects/${id}/source.zip`);
    return NextResponse.json({
      url: signed.url === "#" ? null : signed.url,
      token,
      expiresIn: signed.expiresIn,
      protected: true,
    });
  } catch {
    return NextResponse.json({ token, protected: true, demo: true });
  }
}
