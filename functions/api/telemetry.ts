// Cloudflare Pages Function: /api/telemetry
// Ingests visitor & device telemetry from anonymous mobile/desktop users,
// bypassing Supabase RLS by using the SUPABASE_SERVICE_ROLE_KEY from environment variables.

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    const body = (await context.request.json().catch(() => null)) as {
      visitor?: Record<string, any>;
      event?: Record<string, any>;
    } | null;

    if (!body || !body.visitor || !body.visitor.visitor_id) {
      return new Response(JSON.stringify({ error: "Invalid visitor payload" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const supabaseUrl =
      context.env?.SUPABASE_URL ||
      context.env?.NEXT_PUBLIC_SUPABASE_URL ||
      "https://rgybafsqexxouyvaxxwa.supabase.co";

    const authKey =
      context.env?.SUPABASE_SERVICE_ROLE_KEY ||
      context.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (!authKey) {
      return new Response(JSON.stringify({ error: "Server authentication not configured" }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    // 1. Fetch current telemetry from Supabase
    const getRes = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?key=eq.analytics_telemetry&select=value`,
      {
        headers: {
          apikey: authKey,
          Authorization: `Bearer ${authKey}`,
        },
      },
    );

    let currentVisitors: Record<string, any> = {};
    let currentEvents: any[] = [];

    if (getRes.ok) {
      const rows = (await getRes.json()) as Array<{
        value?: {
          visitors?: Record<string, any>;
          events?: any[];
        };
      }>;
      if (Array.isArray(rows) && rows[0]?.value) {
        currentVisitors = rows[0].value.visitors || {};
        currentEvents = Array.isArray(rows[0].value.events) ? rows[0].value.events : [];
      }
    }

    // 2. Merge visitor payload
    const visitor = body.visitor;
    const existing = currentVisitors[visitor.visitor_id] || {};
    currentVisitors[visitor.visitor_id] = {
      ...existing,
      ...visitor,
      last_seen: new Date().toISOString(),
      total_visits: (existing.total_visits || 0) + 1,
    };

    // 3. Merge event payload
    if (body.event) {
      currentEvents.unshift({
        id: `e_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`,
        visitor_id: visitor.visitor_id,
        created_at: new Date().toISOString(),
        ...body.event,
      });
      if (currentEvents.length > 200) currentEvents.length = 200;
    }

    // 4. Save to Supabase using authKey
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/system_settings`, {
      method: "POST",
      headers: {
        apikey: authKey,
        Authorization: `Bearer ${authKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        key: "analytics_telemetry",
        value: {
          visitors: currentVisitors,
          events: currentEvents,
        },
      }),
    });

    return new Response(
      JSON.stringify({ success: upsertRes.ok, status: upsertRes.status }),
      {
        status: upsertRes.ok ? 200 : 500,
        headers: CORS_HEADERS,
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
