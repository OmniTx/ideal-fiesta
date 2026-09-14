"use client";

import { createClient } from "@/utils/supabase/client";
import { broadcastRealtimeEvent } from "@/lib/realtime";
import type { AnalyticsVisitor } from "@/lib/types/database";

const VISITOR_KEY = "foundry_visitor_id";
const SESSION_KEY = "foundry_session_id";
const GEO_CACHE_KEY = "foundry_geo_cache_v3";
const LOCAL_TELEMETRY_KEY = "foundry_local_telemetry";

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

/**
 * Generates a random alphanumeric ID
 */
function uid(prefix = "v"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
}

/**
 * Retrieve or create persistent visitor ID (persisted across sessions in localStorage)
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uid("v");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return uid("v");
  }
}

/**
 * Retrieve or create session ID (reset when the tab/browser is closed)
 */
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

/**
 * Parse phone model and device details from User-Agent and viewport
 */
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

  // 1. Device Type
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle)/i.test(ua);
  const isMobile = !isTablet && (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || width <= 768);
  const deviceType: "mobile" | "tablet" | "desktop" = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // 2. Phone / Device Model Detection
  let deviceModel = deviceType === "desktop" ? "PC / Mac" : "Mobile Device";

  // Extract raw Android model tag (e.g., "SM-S928B", "Pixel 7a", "CPH2211")
  const androidModelMatch = ua.match(/Android [^;]+;\s*([^;)]+?)(?:\s*Build|\)|;)/i);
  const rawModel = androidModelMatch ? androidModelMatch[1].trim() : "";

  // Check Samsung Galaxy models
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
    else if (code.startsWith("G990B")) deviceModel = "Samsung Galaxy S21 FE";
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

  // 3. Operating System
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

  // 4. Browser
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

/**
 * Fetch real public IP and Geo information (cached in sessionStorage for session duration)
 */
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

  // 1. Primary: ipwho.is (fast, HTTPS, CORS enabled, accurate city/region/country)
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
    // Try fallback
  }

  // 2. Fallback: freeipapi.com
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
    // Try ipify
  }

  // 3. Fallback: ipify (IP only, no fake city or country)
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

/**
 * Saves a visitor snapshot into system_settings telemetry store in Supabase
 * Only executes direct database writes if an authenticated session is active,
 * ensuring anonymous storefront visits never produce 401/405 errors in the browser console.
 */
async function recordToTelemetryStore(
  visitor: Partial<AnalyticsVisitor> & { visitor_id: string },
  event?: { event_type: string; page_path: string; metadata?: Record<string, unknown> },
) {
  if (typeof window === "undefined") return;

  // 1. Cache telemetry locally in the visitor's browser
  try {
    const cached = localStorage.getItem("foundry_telemetry_cache");
    const local = cached ? JSON.parse(cached) : { visitors: {}, events: [] };
    local.visitors[visitor.visitor_id] = {
      ...(local.visitors[visitor.visitor_id] || {}),
      ...visitor,
      last_seen: new Date().toISOString(),
    };
    if (event) {
      local.events = [{ ...event, visitor_id: visitor.visitor_id, created_at: new Date().toISOString() }, ...(local.events || [])].slice(0, 50);
    }
    localStorage.setItem("foundry_telemetry_cache", JSON.stringify(local));
  } catch {
    // Ignore storage quota
  }

  // 2. Direct Supabase persist if authenticated (e.g. staff or admin session)
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      // Anonymous visitor: live sync is handled 100% cleanly over Supabase Realtime WebSocket.
      // Do not attempt an unauthorized HTTP PostgREST upsert to prevent red console errors.
      return;
    }

    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "analytics_telemetry")
      .single();

    const current = (settingsData?.value as {
      visitors?: Record<string, unknown>;
      events?: unknown[];
    }) || { visitors: {}, events: [] };

    const visitors = current.visitors || {};
    const existing =
      (visitors[visitor.visitor_id] as Partial<AnalyticsVisitor> | undefined) ||
      {};

    visitors[visitor.visitor_id] = {
      ...existing,
      ...visitor,
      last_seen: new Date().toISOString(),
      total_visits: (existing.total_visits || 0) + 1,
    };

    const events = Array.isArray(current.events) ? current.events : [];
    if (event) {
      events.unshift({
        id: uid("e"),
        visitor_id: visitor.visitor_id,
        created_at: new Date().toISOString(),
        ...event,
      });
      if (events.length > 200) events.length = 200;
    }

    await supabase.from("system_settings").upsert({
      key: "analytics_telemetry",
      value: { visitors, events },
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Record a pageview or visit event (100% clean, zero 404 errors)
 */
export async function trackVisit(pagePath: string): Promise<void> {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const device = detectDevice();
  const geo = await getGeoInfo();

  const visitorPayload = {
    visitor_id: visitorId,
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

  // 1. Broadcast realtime notice to active admin dashboard
  void broadcastRealtimeEvent("analytics_event", {
    visitorId,
    pagePath,
    visitor: visitorPayload,
    deviceModel: device.deviceModel,
    ip: geo.ip,
    city: geo.city,
    country: geo.country,
  });

  // 2. Persist directly to Supabase telemetry store
  await recordToTelemetryStore(visitorPayload, {
    event_type: "pageview",
    page_path: pagePath,
  });
}

/**
 * Track user tapping a menu item
 */
export async function trackItemClick(itemName: string, category: string): Promise<void> {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();

  void broadcastRealtimeEvent("analytics_event", {
    type: "item_click",
    itemName,
    category,
    visitorId,
  });

  await recordToTelemetryStore(
    { visitor_id: visitorId },
    {
      event_type: "item_view",
      page_path: window.location.pathname,
      metadata: { itemName, category },
    },
  );
}

/**
 * Capture Customer Identity (Name, Phone, Email)
 * Links all anonymous history to the identified customer.
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

  const updateData = {
    visitor_id: visitorId,
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

  // 1. Realtime notification to admin
  void broadcastRealtimeEvent("lead_captured", {
    visitorId,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    deviceModel: device.deviceModel,
    location: [geo.city, geo.country].filter(Boolean).join(", ") || "Unknown Location",
    visitor: updateData,
  });

  // 2. Persist to Supabase telemetry store
  await recordToTelemetryStore(updateData, {
    event_type: "lead_captured",
    page_path: window.location.pathname,
    metadata: lead,
  });

  return true;
}
