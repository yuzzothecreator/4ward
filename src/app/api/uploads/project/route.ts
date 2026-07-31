import { NextResponse } from "next/server";
import { uploadProjectFile } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { resolveApiActor } from "@/lib/auth";
import {
  requireRateLimit,
  requireSameOrigin,
} from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Upload a project source ZIP (or docs) to Supabase Storage.
 * Requires a signed-in seller (Clerk in production).
 * FormData: file, slug? (optional project slug for path)
 */
export async function POST(req: Request) {
  try {
    const originBlock = requireSameOrigin(req);
    if (originBlock) return originBlock;
    const limited = requireRateLimit(req, "upload", 15, 60_000);
    if (limited) return limited;

    const form = await req.formData();
    const actor = await resolveApiActor({
      fallbackEmail: String(form.get("email") || "demo-uploader@4ward.local"),
    });
    if (!actor.ok) return actor.response;

    const file = form.get("file");
    const slugRaw = String(form.get("slug") || "untitled");
    const kind = String(form.get("kind") || "source"); // source | docs | cover

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    const slug = slugify(slugRaw) || "untitled";
    const ownerKey = actor.userId || actor.email.replace(/[^a-z0-9]/gi, "_");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path =
      kind === "source"
        ? `projects/${ownerKey}/${slug}/source.zip`
        : `projects/${ownerKey}/${slug}/${kind}-${safeName}`;

    const uploaded = await uploadProjectFile(file, path, file.type || undefined);

    return NextResponse.json({
      success: true,
      path: uploaded.path,
      url: uploaded.url,
      demo: uploaded.path.startsWith("demo/"),
      kind,
      owner: actor.email,
    });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
