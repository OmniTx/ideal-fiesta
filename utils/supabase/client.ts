import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Every admin page and mutation goes through this —
 * authorisation is enforced by RLS, never by the client.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in .env locally and as build-time secrets in CI.",
    );
  }

  return createBrowserClient(url, anonKey);
}
