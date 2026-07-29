import { NextResponse } from "next/server";
import { uploadProjectFile } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Upload a project source ZIP (or docs) to Supabase Storage.
 * FormData: file, slug? (optional project slug for path)
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anon";
    const limited = rateLimit(`upload:${ip}`, 15, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
    }

    const form = await req.formData();
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
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path =
      kind === "source"
        ? `projects/${slug}/source.zip`
        : `projects/${slug}/${kind}-${safeName}`;

    const uploaded = await uploadProjectFile(file, path, file.type || undefined);

    return NextResponse.json({
      success: true,
      path: uploaded.path,
      url: uploaded.url,
      demo: uploaded.path.startsWith("demo/"),
      kind,
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
