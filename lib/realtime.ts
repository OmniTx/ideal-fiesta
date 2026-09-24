import { createClient } from "@/utils/supabase/client";

/**
 * Public storefront topic: menu and settings sync. Deliberately carries no
 * customer data, so anonymous browsers may read and write it.
 */
export const REALTIME_CHANNEL = "foundry-live-sync";

/**
 * Customer-activity topic for the signed-in admin dashboard. Realtime
 * Authorization restricts subscriptions to admins, and the payloads are opaque
 * "something changed" pings — the dashboard re-reads the rows through RLS.
 */
export const ADMIN_REALTIME_CHANNEL = "foundry-admin-live";

export type RealtimeEvent =
  | "menu_updated"
  | "settings_updated"
  | "analytics_event"
  | "lead_captured";

/** Events about customer activity, which travel on the private topic only. */
const ADMIN_EVENTS: readonly RealtimeEvent[] = [
  "analytics_event",
  "lead_captured",
];

function topicFor(event: RealtimeEvent): string {
  return ADMIN_EVENTS.includes(event) ? ADMIN_REALTIME_CHANNEL : REALTIME_CHANNEL;
}

/**
 * Broadcast an event across all connected browser windows (storefront & admin).
 * Uses Supabase Realtime Broadcast for instant, sub-second delivery.
 *
 * Never pass customer PII here: everything published on these topics is
 * readable by every client that can join them.
 */
export async function broadcastRealtimeEvent(
  event: RealtimeEvent,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return;

  const supabase = createClient();
  const channel = supabase.channel(topicFor(event), {
    config: { private: true },
  });

  try {
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
  } finally {
    // One-shot channel — release it so long sessions don't accumulate them.
    void supabase.removeChannel(channel);
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
  const channel = supabase.channel(REALTIME_CHANNEL, {
    config: { private: true },
  });

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
  const channel = supabase.channel(REALTIME_CHANNEL, {
    config: { private: true },
  });

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

export interface AnalyticsSignal {
  event: "analytics_event" | "lead_captured";
  payload: Record<string, unknown>;
}

/**
 * Subscribe to customer-activity pings on the private admin topic. The payloads
 * carry no customer data, so a signal means "read the rows again" — the data
 * itself only ever arrives through an RLS-scoped SELECT.
 */
export function subscribeToAnalytics(
  onSignal: (signal: AnalyticsSignal) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = createClient();
  const channel = supabase.channel(ADMIN_REALTIME_CHANNEL, {
    config: { private: true },
  });

  const forward =
    (event: AnalyticsSignal["event"]) =>
    (message: { payload?: unknown }) => {
      onSignal({
        event,
        payload:
          message?.payload && typeof message.payload === "object"
            ? (message.payload as Record<string, unknown>)
            : {},
      });
    };

  channel
    .on("broadcast", { event: "analytics_event" }, forward("analytics_event"))
    .on("broadcast", { event: "lead_captured" }, forward("lead_captured"))
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
