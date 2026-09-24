/**
 * "Is this visitor on the site right now?"
 *
 * `last_seen` alone is not enough. It only moves on a pageview, so someone
 * reading the menu without navigating looks stale, and someone who closed the
 * tab looks present until the window expires. So a visitor is live when they
 * were seen inside the window AND have not reported leaving since.
 *
 * The device sends that report on tab-hide and page-unload, and pings every
 * minute while visible (see `startPresenceTracking`), so a three-minute window
 * tolerates two missed pings.
 */
export const LIVE_WINDOW_MS = 3 * 60 * 1000;

export interface PresenceRow {
  last_seen: string;
  left_at?: string | null;
}

export function isVisitorLive(
  visitor: PresenceRow,
  now: number = Date.now(),
): boolean {
  const lastSeen = new Date(visitor.last_seen).getTime();
  if (!Number.isFinite(lastSeen) || now - lastSeen > LIVE_WINDOW_MS) return false;

  if (visitor.left_at) {
    const leftAt = new Date(visitor.left_at).getTime();
    // Left after their last activity means they are gone; a later visit clears
    // left_at, so this can only suppress genuinely stale rows.
    if (Number.isFinite(leftAt) && leftAt >= lastSeen) return false;
  }

  return true;
}

/** The cutoff to hand PostgREST when filtering server-side. */
export function liveSinceIso(now: number = Date.now()): string {
  return new Date(now - LIVE_WINDOW_MS).toISOString();
}
