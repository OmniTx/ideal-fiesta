"use client";

import { broadcastRealtimeEvent } from "@/lib/realtime";
import { getVisitorId, getVisitorSecret } from "@/lib/visitor-identity";
import { createClient } from "@/utils/supabase/client";
import type { AnalyticsVisitor } from "@/lib/types/database";

const SESSION_KEY = "foundry_session_id";
const GEO_CACHE_KEY = "foundry_geo_cache_v3";

export interface DeviceInfo {
  deviceType: "mobile" | "tablet" | "desktop";
  deviceModel: string;
  os: string;
  browser: string;
  screenRes: string;
  userAgent: string;
}

export interface GeoInfo {
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

function uid(prefix = "v"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
}

/** Session ID, reset when the tab/browser is closed. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uid("s");
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return uid("s");
  }
}

/** Best-effort device classification from UA string and viewport. */
export function detectDevice(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      deviceType: "desktop",
      deviceModel: "Unknown",
      os: "Unknown",
      browser: "Unknown",
      screenRes: "0x0",
      userAgent: "",
    };
  }

  const ua = navigator.userAgent;
  const width = window.screen?.width || window.innerWidth || 0;
  const height = window.screen?.height || window.innerHeight || 0;
  const screenRes = `${width}x${height}`;

  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle)/i.test(ua);
  const isMobile = !isTablet && (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || width <= 768);
  const deviceType: "mobile" | "tablet" | "desktop" = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let deviceModel = deviceType === "desktop" ? "PC / Mac" : "Mobile Device";

  const androidModelMatch = ua.match(/Android [^;]+;\s*([^;)]+?)(?:\s*Build|\)|;)/i);
  const rawModel = androidModelMatch ? androidModelMatch[1].trim() : "";

  const smMatch = ua.match(/SM-([A-Z0-9]+)/i) || (rawModel.startsWith("SM-") ? [null, rawModel.slice(3)] : null);
  if (smMatch) {
    const code = smMatch[1].toUpperCase();
    if (code.startsWith("G988")) deviceModel = "Samsung Galaxy S20 Ultra";
    else if (code.startsWith("G985")) deviceModel = "Samsung Galaxy S20+";
    else if (code.startsWith("G980") || code.startsWith("G981")) deviceModel = "Samsung Galaxy S20";
    else if (code.startsWith("G780") || code.startsWith("G781")) deviceModel = "Samsung Galaxy S20 FE";
    else if (code.startsWith("G998")) deviceModel = "Samsung Galaxy S21 Ultra";
    else if (code.startsWith("G996")) deviceModel = "Samsung Galaxy S21+";
    else if (code.startsWith("G990") || code.startsWith("G991")) deviceModel = "Samsung Galaxy S21";
    else if (code.startsWith("S908")) deviceModel = "Samsung Galaxy S22 Ultra";
    else if (code.startsWith("S906")) deviceModel = "Samsung Galaxy S22+";
    else if (code.startsWith("S901")) deviceModel = "Samsung Galaxy S22";
    else if (code.startsWith("S918")) deviceModel = "Samsung Galaxy S23 Ultra";
    else if (code.startsWith("S916")) deviceModel = "Samsung Galaxy S23+";
    else if (code.startsWith("S911")) deviceModel = "Samsung Galaxy S23";
    else if (code.startsWith("S928")) deviceModel = "Samsung Galaxy S24 Ultra";
    else if (code.startsWith("S926")) deviceModel = "Samsung Galaxy S24+";
    else if (code.startsWith("S921")) deviceModel = "Samsung Galaxy S24";
    else if (code.startsWith("F946") || code.startsWith("F956")) deviceModel = "Samsung Galaxy Z Fold";
    else if (code.startsWith("F731") || code.startsWith("F741")) deviceModel = "Samsung Galaxy Z Flip";
    else if (code.startsWith("A54")) deviceModel = "Samsung Galaxy A54";
    else if (code.startsWith("A53")) deviceModel = "Samsung Galaxy A53";
    else if (code.startsWith("A52")) deviceModel = "Samsung Galaxy A52";
    else if (code.startsWith("A34") || code.startsWith("A35")) deviceModel = "Samsung Galaxy A3x";
    else if (code.startsWith("A")) deviceModel = `Samsung Galaxy A-Series (${code})`;
    else deviceModel = `Samsung Galaxy (${code})`;
  } else if (/samsung/i.test(ua)) {
    deviceModel = rawModel ? `Samsung (${rawModel})` : "Samsung Mobile";
  } else if (/iphone/i.test(ua)) {
    if ((width === 430 && height === 932) || (width === 932 && height === 430)) deviceModel = "Apple iPhone 15/16 Pro Max";
    else if ((width === 393 && height === 852) || (width === 852 && height === 393)) deviceModel = "Apple iPhone 14/15/16 Pro";
    else if ((width === 390 && height === 844) || (width === 844 && height === 390)) deviceModel = "Apple iPhone 12/13/14";
    else if ((width === 414 && height === 896) || (width === 896 && height === 414)) deviceModel = "Apple iPhone 11 / XR / XS Max";
    else if ((width === 375 && height === 812) || (width === 812 && height === 375)) deviceModel = "Apple iPhone X / XS / 11 Pro / 12 mini";
    else if ((width === 375 && height === 667) || (width === 667 && height === 375)) deviceModel = "Apple iPhone SE / 8 / 7";
    else deviceModel = "Apple iPhone";
  } else if (/ipad/i.test(ua)) {
    deviceModel = "Apple iPad";
  } else if (/pixel/i.test(ua)) {
    const pMatch = ua.match(/Pixel\s?([0-9a-zA-Z ]+)/i);
    deviceModel = pMatch ? `Google Pixel ${pMatch[1]}` : (rawModel || "Google Pixel");
  } else if (/xiaomi|redmi|poco/i.test(ua)) {
    deviceModel = rawModel ? `Xiaomi / Redmi (${rawModel})` : "Xiaomi / Redmi";
  } else if (/oppo|cph/i.test(ua)) {
    deviceModel = rawModel ? `OPPO (${rawModel})` : "OPPO Mobile";
  } else if (/oneplus/i.test(ua)) {
    deviceModel = rawModel ? `OnePlus (${rawModel})` : "OnePlus Mobile";
  } else if (/vivo|v2[0-9]{3}/i.test(ua)) {
    deviceModel = rawModel ? `vivo (${rawModel})` : "vivo Mobile";
  } else if (/realme|rmx/i.test(ua)) {
    deviceModel = rawModel ? `realme (${rawModel})` : "realme Mobile";
  } else if (rawModel && deviceType === "mobile") {
    deviceModel = rawModel;
  } else if (/macintosh/i.test(ua)) {
    deviceModel = "Apple Mac";
  } else if (/windows/i.test(ua)) {
    deviceModel = "Windows PC";
  }

  let os = "Unknown OS";
  if (/android/i.test(ua)) {
    const ver = ua.match(/android\s([0-9.]+)/i);
    os = ver ? `Android ${ver[1]}` : "Android";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const ver = ua.match(/os\s([0-9_]+)/i);
    os = ver ? `iOS ${ver[1].replace(/_/g, ".")}` : "iOS";
  } else if (/windows nt 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";

  return {
    deviceType,
    deviceModel,
    os,
    browser,
    screenRes,
    userAgent: ua,
  };
}

/** Real public IP + geo, cached for the session. Three providers, all HTTPS+CORS. */
export async function getGeoInfo(): Promise<GeoInfo> {
  if (typeof window === "undefined") {
    return { ip: null, city: null, region: null, country: null };
  }

  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.ip) return parsed;
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch("https://ipwho.is/", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.ip) {
        const info: GeoInfo = {
          ip: data.ip,
          city: data.city || null,
          region: data.region || null,
          country: data.country || null,
        };
        try {
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(info));
        } catch {}
        return info;
      }
    }
  } catch {
    // try fallback
  }

  try {
    const res = await fetch("https://freeipapi.com/api/json", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ipAddress) {
        const info: GeoInfo = {
          ip: data.ipAddress,
          city: data.cityName || null,
          region: data.regionName || null,
          country: data.countryName || null,
        };
        try {
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(info));
        } catch {}
        return info;
      }
    }
  } catch {
    // try ipify
  }

  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const info: GeoInfo = {
          ip: data.ip,
          city: null,
          region: null,
          country: null,
        };
        try {
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(info));
        } catch {}
        return info;
      }
    }
  } catch {
    // offline or blocked
  }

  return { ip: null, city: null, region: null, country: null };
}

type VisitorUpsert = Partial<Omit<AnalyticsVisitor, "total_visits" | "first_seen">> & {
  visitor_id: string;
};

interface EventInsert {
  visitor_id: string;
  session_id: string;
  event_type: "pageview" | "item_view" | "category_change" | "lead_captured";
  page_path: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Persist a visitor snapshot. RLS lets an anonymous browser insert/update only
 * the analytics_visitors row carrying its own capability token, so this works
 * with no admin session or open dashboard. Only the columns passed in are
 * written, so a plain pageview never clobbers a previously captured
 * name/phone/email.
 */
async function upsertVisitor(fields: VisitorUpsert): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("analytics_visitors")
      .upsert(fields, { onConflict: "visitor_id" });
    if (error) console.warn("[Analytics] Visitor upsert failed:", error.message);
  } catch {
    // Non-fatal
  }
}

/** Persist one clickstream event. RLS allows anonymous inserts. */
async function insertEvent(event: EventInsert): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("analytics_events").insert(event);
    if (error) console.warn("[Analytics] Event insert failed:", error.message);
  } catch {
    // Non-fatal
  }
}

/** Record a pageview: durable write to the analytics tables + a live ping. */
export async function trackVisit(pagePath: string): Promise<void> {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const device = detectDevice();
  const geo = await getGeoInfo();

  const visitorPayload: VisitorUpsert = {
    visitor_id: visitorId,
    visitor_secret: getVisitorSecret(),
    last_seen: new Date().toISOString(),
    last_ip: geo.ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    device_type: device.deviceType,
    device_model: device.deviceModel,
    os: device.os,
    browser: device.browser,
    screen_res: device.screenRes,
    user_agent: device.userAgent,
  };

  // analytics_events.visitor_id is a foreign key to analytics_visitors, so the
  // upsert has to land first — run in parallel the insert can race ahead and
  // be rejected with a foreign key violation.
  await upsertVisitor(visitorPayload);
  await insertEvent({
    visitor_id: visitorId,
    session_id: sessionId,
    event_type: "pageview",
    page_path: pagePath,
    ip: geo.ip,
    metadata: {
      deviceModel: device.deviceModel,
      city: geo.city,
      country: geo.country,
    },
  });

  // Signal only. Telemetry stays in Postgres and reaches the dashboard through
  // an RLS-scoped read — customer data never crosses a Realtime channel.
  void broadcastRealtimeEvent("analytics_event", { visitorId, pagePath });
}

/** Track a menu item tap. */
export async function trackItemClick(itemName: string, category: string): Promise<void> {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();

  await insertEvent({
    visitor_id: visitorId,
    session_id: getSessionId(),
    event_type: "item_view",
    page_path: window.location.pathname,
    metadata: { itemName, category },
  });

  void broadcastRealtimeEvent("analytics_event", {
    type: "item_click",
    itemName,
    category,
    visitorId,
  });
}

/**
 * Capture customer identity (name/phone/email) and link it to the visitor's
 * anonymous history. Persists immediately — no admin needs to be online.
 */
export async function captureCustomerLead(lead: {
  name?: string;
  phone?: string;
  email?: string;
  source?: string;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const visitorId = getVisitorId();
  const device = detectDevice();
  const geo = await getGeoInfo();

  const updateData: VisitorUpsert = {
    visitor_id: visitorId,
    visitor_secret: getVisitorSecret(),
    name: lead.name?.trim() || null,
    phone: lead.phone?.trim() || null,
    email: lead.email?.trim().toLowerCase() || null,
    last_seen: new Date().toISOString(),
    last_ip: geo.ip,
    city: geo.city,
    region: geo.region,
    country: geo.country,
    device_type: device.deviceType,
    device_model: device.deviceModel,
    os: device.os,
    browser: device.browser,
    screen_res: device.screenRes,
  };

  await upsertVisitor(updateData);
  await insertEvent({
    visitor_id: visitorId,
    session_id: getSessionId(),
    event_type: "lead_captured",
    page_path: window.location.pathname,
    ip: geo.ip,
    metadata: { source: lead.source ?? null },
  });

  // Signal only: the contact details are read back by the signed-in dashboard
  // through RLS. Never put customer PII on a Realtime channel.
  void broadcastRealtimeEvent("lead_captured", { visitorId });

  return true;
}
