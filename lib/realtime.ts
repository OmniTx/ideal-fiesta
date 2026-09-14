import { createClient } from "@/utils/supabase/client";

export const REALTIME_CHANNEL = "foundry-live-sync";

export type RealtimeEvent =
  | "menu_updated"
  | "settings_updated"
  | "analytics_event"
  | "lead_captured";

/**
 * Broadcast an event across all connected browser windows (storefront & admin).
 * Uses Supabase Realtime Broadcast for instant, sub-second delivery.
 */
export async function broadcastRealtimeEvent(
  event: RealtimeEvent,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const supabase = createClient();
    const channel = supabase.channel(REALTIME_CHANNEL);

    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          resolve();
        }
      });
      setTimeout(resolve, 600);
    });

    await channel.send({
      type: "broadcast",
      event,
      payload: { ...payload, timestamp: Date.now() },
    });
  } catch (err) {
    console.warn("[Realtime] Broadcast notice error:", err);
  }
}

/**
 * Subscribe to menu item changes via:
 * 1. Supabase Realtime Broadcast (instant sub-second sync across tabs)
 * 2. Supabase Postgres Changes (if enabled on database)
 * 3. Window focus / visibilitychange (ensures stale tabs sync when opened)
 */
export function subscribeToMenuChanges(onUpdate: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = createClient();
  const channel = supabase.channel(REALTIME_CHANNEL);

  channel
    .on("broadcast", { event: "menu_updated" }, () => {
      onUpdate();
    })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_items" },
      () => {
        onUpdate();
      },
    )
    .subscribe();

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      onUpdate();
    }
  };

  window.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("focus", handleVisibility);

  return () => {
    void supabase.removeChannel(channel);
    window.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("focus", handleVisibility);
  };
}

/**
 * Subscribe to settings changes (hours, surcharge, theme) via:
 * 1. Supabase Realtime Broadcast
 * 2. Supabase Postgres Changes
 * 3. Window visibility/focus
 */
export function subscribeToSettingsChanges(
  onUpdate: (key?: string) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = createClient();
  const channel = supabase.channel(REALTIME_CHANNEL);

  channel
    .on("broadcast", { event: "settings_updated" }, (payload) => {
      const key = (payload?.payload as { key?: string } | undefined)?.key;
      onUpdate(key);
    })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "system_settings" },
      () => {
        onUpdate();
      },
    )
    .subscribe();

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      onUpdate();
    }
  };

  window.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("focus", handleVisibility);

  return () => {
    void supabase.removeChannel(channel);
    window.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("focus", handleVisibility);
  };
}

/**
 * Subscribe to analytics and new lead events
 */
export function subscribeToAnalytics(
  onUpdate: (payload?: unknown) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = createClient();
  const channel = supabase.channel(REALTIME_CHANNEL);

  channel
    .on("broadcast", { event: "analytics_event" }, (p) => onUpdate(p))
    .on("broadcast", { event: "lead_captured" }, (p) => onUpdate(p))
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
