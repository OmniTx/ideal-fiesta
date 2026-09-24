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

/**
 * The RLS policies on analytics_visitors, analytics_events, orders and
 * rewards_members all reject a capability token shorter than this. Enforce the
 * floor here too: a token the database will refuse must never be stored, or the
 * device is stuck sending it forever.
 */
const MIN_SECRET_LENGTH = 32;

export interface VisitorIdentity {
  visitorId: string;
  visitorSecret: string;
}

function randomToken(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  // `crypto.randomUUID` requires a secure context, so plain http on a LAN
  // address falls through to here. Accumulate until the floor is cleared rather
  // than appending a fixed number of segments, which used to land on ~20
  // characters and be rejected by every policy as if the caller were anonymous.
  let entropy = "";
  while (entropy.length < MIN_SECRET_LENGTH) {
    entropy += Math.random().toString(36).slice(2);
  }
  return `${prefix}_${entropy}`;
}

function isUsableSecret(value: string | null): value is string {
  return value !== null && value.length >= MIN_SECRET_LENGTH;
}

/** Keeps a single identity when storage is unavailable (private mode, etc.). */
let memoryFallback: VisitorIdentity | null = null;

/**
 * The device's visitor id + capability token, created together on first use.
 *
 * A device with no token, or with one too short for the policies to accept, gets
 * a fresh pair: its historic rows predate or mismatch the token, so reusing that
 * visitor id would keep pointing at a row whose secret can never match.
 */
export function getVisitorIdentity(): VisitorIdentity {
  if (typeof window === "undefined") {
    return { visitorId: "", visitorSecret: "" };
  }

  try {
    const storedSecret = localStorage.getItem(VISITOR_SECRET_KEY);
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!isUsableSecret(storedSecret)) {
      const visitorSecret = randomToken("vs");
      visitorId = randomToken("v");
      localStorage.setItem(VISITOR_SECRET_KEY, visitorSecret);
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      return { visitorId, visitorSecret };
    }

    if (!visitorId) {
      visitorId = randomToken("v");
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return { visitorId, visitorSecret: storedSecret };
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
