import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Every admin page and mutation goes through this —
 * authorisation is enforced by RLS, never by the client.
 */
export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://rgybafsqexxouyvaxxwa.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_biR7fyJ3FGPmt40dHI8wUQ_P6howGpJ";

  return createBrowserClient(url, anonKey);
}
