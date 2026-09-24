import { createBrowserClient } from "@supabase/ssr";

import { getVisitorSecret } from "@/lib/visitor-identity";

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

  return createBrowserClient(url, anonKey, {
    global: {
      headers: {
        // Proves this browser owns its own analytics row. The RLS policies on
        // analytics_visitors/analytics_events match it against the stored
        // capability token, so an anonymous client can only write its own data.
        "x-visitor-secret": getVisitorSecret(),
      },
    },
  });
}
