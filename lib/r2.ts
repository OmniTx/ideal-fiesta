import { createClient } from "@/utils/supabase/client";

/**
 * Client-side R2 helpers. The Next.js app never holds R2 credentials — it asks
 * the `presign-r2` Edge Function for a short-lived URL and uploads directly.
 */
export const R2_BUCKET = "foundry-menu";
export const R2_PUBLIC_BASE_URL = "https://media.foundryartisancoffee.com";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PRESIGN_ENDPOINT = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL
}/functions/v1/presign-r2`;

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

async function authorisedHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You need to be signed in to manage images.");
  }

  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // fall through to the generic message
  }
  return `Request failed (${res.status})`;
}

export function isAllowedImage(file: File): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

/** Uploads a file straight to R2 and returns its public URL + object key. */
export async function uploadImageToR2(
  file: File,
): Promise<{ publicUrl: string; key: string }> {
  if (!isAllowedImage(file)) {
    throw new Error("Images must be a JPEG, PNG or WebP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const headers = await authorisedHeaders();

  const presignRes = await fetch(PRESIGN_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "presign",
      filename: file.name,
      contentType: file.type,
    }),
  });

  if (!presignRes.ok) {
    throw new Error(await errorMessage(presignRes));
  }

  const { uploadUrl, publicUrl, key }: PresignResponse =
    await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Image upload failed (${putRes.status}).`);
  }

  return { publicUrl, key };
}

/** Best-effort cleanup — callers treat failures as non-fatal. */
export async function deleteR2Object(key: string): Promise<void> {
  const headers = await authorisedHeaders();
  const res = await fetch(PRESIGN_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "delete", key }),
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res));
  }
}

/** Extracts the R2 object key from a stored public URL, if it is one. */
export function r2KeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const prefix = `${R2_PUBLIC_BASE_URL}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
