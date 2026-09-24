"use client";

import { broadcastRealtimeEvent } from "@/lib/realtime";
import { isMissingFunction } from "@/lib/rpc";
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
 * Everything the visitor row needs.
 *
 * `track_visit` overwrites every telemetry column it is handed, so a partial
 * payload would blank the device details — which is why the presence heartbeat
 * sends this rather than a bare timestamp.
 */
async function buildVisitorPayload(): Promise<{
  payload: VisitorUpsert;
  device: DeviceInfo;
  geo: GeoInfo;
}> {
  const device = detectDevice();
  const geo = await getGeoInfo();

  return {
    device,
    geo,
    payload: {
      visitor_id: getVisitorId(),
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
    },
  };
}

/**
 * Persist activity through `track_visit`, which takes the capability token as a
 * parameter and compares it against the stored row inside SQL.
 *
 * The token deliberately does NOT travel in the `x-visitor-secret` header any
 * more. The header path proved reliable when a request was made by hand but the
 * storefront's own requests were refused by every policy that used it, and a
 * request header is the wrong place to put the one value the whole ownership
 * check depends on.
 *
 * Falls back to the two direct table writes only when that function is absent,
 * so a project that has not applied 0011 keeps working.
 */
async function recordActivity(input: {
  visitor?: VisitorUpsert;
  event?: EventInsert;
}): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("track_visit", {
      p_secret: getVisitorSecret(),
      p_visitor: input.visitor ?? null,
      p_event: input.event ?? null,
    });

    if (!error) return;

    if (!isMissingFunction(error)) {
      console.warn("[Analytics] track_visit failed:", error.message);
      return;
    }
  } catch {
    // Fall through to the direct writes below.
  }

  try {
    const supabase = createClient();

    if (input.visitor) {
      const { error } = await supabase
        .from("analytics_visitors")
        .upsert(input.visitor, { onConflict: "visitor_id" });
      if (error) console.warn("[Analytics] Visitor upsert failed:", error.message);
    }

    if (input.event) {
      const { error } = await supabase.from("analytics_events").insert(input.event);
      if (error) console.warn("[Analytics] Event insert failed:", error.message);
    }
  } catch {
    // Non-fatal: analytics must never break the storefront.
  }
}

/** Record a pageview: durable write to the analytics tables + a live ping. */
export async function trackVisit(pagePath: string): Promise<void> {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const { payload: visitorPayload, device, geo } = await buildVisitorPayload();

  // One call: track_visit writes the visitor row and the event in a single
  // transaction, so the foreign key can no longer race ahead of the upsert.
  await recordActivity({
    visitor: visitorPayload,
    event: {
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

  await recordActivity({
    event: {
      visitor_id: visitorId,
      session_id: getSessionId(),
      event_type: "item_view",
      page_path: window.location.pathname,
      metadata: { itemName, category },
    },
  });

  void broadcastRealtimeEvent("analytics_event", {
    type: "item_click",
    itemName,
    category,
    visitorId,
  });
}

/** How often a visible tab tells the database it is still here. */
const HEARTBEAT_MS = 60 * 1000;

/** Best-effort "I am leaving" — only ever touches this device's own row. */
async function markVisitorLeft(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const supabase = createClient();
    await supabase.rpc("mark_visitor_left", {
      p_secret: getVisitorSecret(),
      p_visitor_id: getVisitorId(),
    });
  } catch {
    // Non-fatal. A torn-down tab may not deliver this at all, which is why the
    // admin also has a timeout window rather than trusting the marker alone.
  }
}

/**
 * Keeps "who is on the site right now" honest.
 *
 * Without this, `last_seen` only moves on a pageview: someone reading the menu
 * looks stale, and someone who closed the tab looks present until the window
 * expires. So a visible tab pings once a minute, and hiding or unloading the tab
 * reports that the visitor has gone.
 */
export function startPresenceTracking(): () => void {
  if (typeof window === "undefined") return () => {};

  let stopped = false;

  const heartbeat = () => {
    if (stopped || document.visibilityState !== "visible") return;
    void (async () => {
      const { payload } = await buildVisitorPayload();
      await recordActivity({ visitor: payload });
    })();
  };

  const timer = setInterval(heartbeat, HEARTBEAT_MS);

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      heartbeat();
    } else {
      void markVisitorLeft();
    }
  };

  const handlePageHide = () => {
    void markVisitorLeft();
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handlePageHide);

  return () => {
    stopped = true;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handlePageHide);
  };
}
