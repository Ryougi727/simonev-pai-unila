import { supabaseAdmin, STORAGE_BUCKET } from "./supabase";

export async function uploadToStorage(path: string, file: Buffer, contentType: string): Promise<string> {
  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(path, file, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFromStorage(path: string) {
  await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);
}

/** Recovers "dokumentasi/xxx/yyy.jpg" from a Supabase public URL, so we can delete
 *  the underlying file when a Dokumentasi row is removed. Returns null for URLs
 *  that aren't Supabase Storage public URLs (e.g. leftover base64 data: URIs from
 *  before this migration — those just get dropped from the DB, nothing to clean up). */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
