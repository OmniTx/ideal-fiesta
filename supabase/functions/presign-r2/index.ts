// Supabase Edge Function: presign-r2
//
// Issues short-lived presigned PUT URLs so the (client-only) admin can upload
// menu images straight to Cloudflare R2 without routing bytes through Next.js.
// Also handles object deletion when an image is replaced or an item removed.
//
// Required secrets (supabase secrets set ...):
//   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID,
//   R2_BUCKET, R2_PUBLIC_BASE_URL, ALLOWED_ORIGINS (comma separated, optional)
//
// SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const R2_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") ?? "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
const R2_BUCKET =
  Deno.env.get("R2_BUCKET") ??
  Deno.env.get("R2_BUCKET_NAME") ??
  "foundry-menu";
const R2_PUBLIC_BASE_URL = (
  Deno.env.get("R2_PUBLIC_BASE_URL") ??
  Deno.env.get("R2_PUBLIC_DOMAIN") ??
  "https://media.foundryartisancoffee.com"
).replace(/\/+$/, "");

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_EXPIRES_SECONDS = 300;

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    ALLOWED_ORIGINS.length === 0
      ? origin ?? "*"
      : origin && ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

async function getUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin);
  }

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return json({ error: "R2 is not configured" }, 500, origin);
  }

  const userId = await getUserId(req.headers.get("Authorization"));
  if (!userId) {
    return json({ error: "Unauthorized" }, 401, origin);
  }

  let payload: {
    action?: string;
    filename?: string;
    contentType?: string;
    key?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }

  // ---------------------------------------------------------------- presign --
  if (payload.action === "presign") {
    const ext = EXTENSION_BY_TYPE[payload.contentType ?? ""];
    if (!ext) {
      return json(
        { error: "Unsupported content type. Use JPEG, PNG or WebP." },
        400,
        origin,
      );
    }

    const key = `menu/${crypto.randomUUID()}.${ext}`;
    const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`);
    url.searchParams.set("X-Amz-Expires", String(MAX_EXPIRES_SECONDS));

    const signed = await r2.sign(
      new Request(url, { method: "PUT" }),
      { aws: { signQuery: true } },
    );

    return json(
      {
        uploadUrl: signed.url,
        publicUrl: `${R2_PUBLIC_BASE_URL}/${key}`,
        key,
        expiresIn: MAX_EXPIRES_SECONDS,
      },
      200,
      origin,
    );
  }

  // ----------------------------------------------------------------- delete --
  if (payload.action === "delete") {
    const key = payload.key ?? "";
    if (!key.startsWith("menu/") || key.includes("..")) {
      return json({ error: "Refusing to delete outside menu/" }, 400, origin);
    }

    const res = await r2.fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      return json({ error: `R2 delete failed (${res.status})` }, 502, origin);
    }

    return json({ deleted: true, key }, 200, origin);
  }

  return json({ error: "Unknown action" }, 400, origin);
});
