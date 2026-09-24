/**
 * Anonymous visitor identity.
 *
 * The storefront writes analytics with no admin session, so ownership cannot
 * come from a login. Instead the browser holds a random capability token beside
 * its visitor id and sends it as the `x-visitor-secret` header; RLS matches it
 * against analytics_visitors.visitor_secret, so a visitor can only write the row
 * carrying their own token.
 */

const VISITOR_ID_KEY = "foundry_visitor_id";
const VISITOR_SECRET_KEY = "foundry_visitor_secret";

export interface VisitorIdentity {
  visitorId: string;
  visitorSecret: string;
}

function randomToken(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
}

/** Keeps a single identity when storage is unavailable (private mode, etc.). */
let memoryFallback: VisitorIdentity | null = null;

/**
 * The device's visitor id + capability token, created together on first use.
 *
 * A device that has no token but does have an old visitor id gets a fresh id:
 * its historic analytics row predates the token and can no longer be updated,
 * so reusing that id would silently break its telemetry and lead capture.
 */
export function getVisitorIdentity(): VisitorIdentity {
  if (typeof window === "undefined") {
    return { visitorId: "", visitorSecret: "" };
  }

  try {
    let visitorSecret = localStorage.getItem(VISITOR_SECRET_KEY);
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorSecret) {
      visitorSecret = randomToken("vs");
      visitorId = randomToken("v");
      localStorage.setItem(VISITOR_SECRET_KEY, visitorSecret);
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    } else if (!visitorId) {
      visitorId = randomToken("v");
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return { visitorId, visitorSecret };
  } catch {
    memoryFallback ??= {
      visitorId: randomToken("v"),
      visitorSecret: randomToken("vs"),
    };
    return memoryFallback;
  }
}

/** Persistent visitor ID, stable across sessions on this device. */
export function getVisitorId(): string {
  return getVisitorIdentity().visitorId;
}

/** Capability token proving this browser owns that visitor id. */
export function getVisitorSecret(): string {
  return getVisitorIdentity().visitorSecret;
}
