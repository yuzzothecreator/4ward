import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const BUCKET = "project-files";

export async function uploadProjectFile(
  file: File | Buffer,
  path: string,
  contentType?: string
) {
  if (!supabaseAdmin) {
    // Demo mode — return a placeholder path
    return {
      path: `demo/${path}`,
      url: `https://placehold.co/800x450/0a0a0a/6366f1?text=Uploaded`,
    };
  }

  const body = file instanceof File ? await file.arrayBuffer() : file;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, body, {
    contentType: contentType || (file instanceof File ? file.type : undefined),
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function getSignedDownloadUrl(path: string, expiresIn = 3600) {
  if (!supabaseAdmin) {
    return { url: "#", expiresIn };
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return { url: data.signedUrl, expiresIn };
}
