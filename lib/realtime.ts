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
  | "lead_captured"
  /** Staff moved a ticket on. Carries no data — the customer refetches. */
  | "orders_updated";

/** Events about customer activity, which travel on the private topic only. */
const ADMIN_EVENTS: readonly RealtimeEvent[] = [
  "analytics_event",
  "lead_captured",
];

/**
 * When channel joins are not working there is no point opening a fresh channel
 * and waiting five seconds for a timeout on every single pageview, so publishing
 * backs off once it has failed. It retries later in case the connection recovers.
 */
const PUBLISH_BACKOFF_MS = 5 * 60 * 1000;
let publishDisabledUntil = 0;

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
  if (Date.now() < publishDisabledUntil) return;

  const supabase = createClient();
  const channel = supabase.channel(topicFor(event), {
    config: { private: true },
  });

  try {
    // Wait for the join rather than racing it. The old version resolved after
    // 600ms regardless, which on a cold socket — the first broadcast of a
    // session, which has to open the websocket and authorise the channel — sent
    // into a channel that was not subscribed yet.
    const status = await new Promise<string>((resolve) => {
      const timer = setTimeout(() => resolve("TIMEOUT"), 5000);
      channel.subscribe((next) => {
        if (
          next === "SUBSCRIBED" ||
          next === "CHANNEL_ERROR" ||
          next === "TIMED_OUT"
        ) {
          clearTimeout(timer);
          resolve(next);
        }
      });
    });

    if (status !== "SUBSCRIBED") {
      // Say it out loud. A rejected join means nothing was published, and
      // silently returning makes realtime look merely quiet. Then stop trying
      // for a while rather than repeating this on every event.
      publishDisabledUntil = Date.now() + PUBLISH_BACKOFF_MS;
      console.warn(
        `[Realtime] "${event}" not published (${status}); pausing publishes for ${PUBLISH_BACKOFF_MS / 60000} minutes.`,
      );
      return;
    }

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

/**
 * Tells a customer's device that a ticket moved, so it can refetch its own rows.
 *
 * This is a broadcast rather than Postgres Changes on `orders` on purpose: a
 * customer's SELECT policy is scoped by capability token, so an anonymous
 * subscriber can never be authorised to receive its own row's changes. The
 * signal carries no data at all — the device reads back through `my_orders`.
 */
export function subscribeToOrderSignals(onSignal: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = createClient();
  const channel = supabase.channel(REALTIME_CHANNEL, {
    config: { private: true },
  });

  channel
    .on("broadcast", { event: "orders_updated" }, () => onSignal())
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export type RealtimeStatus = "connecting" | "connected" | "error";

export interface RealtimeHealth {
  /** The channel the app actually uses. */
  private: RealtimeStatus;
  /** The same topic without the private flag, to isolate the cause. */
  public: RealtimeStatus;
  /** Whatever the server said when it refused, if it said anything. */
  error: string | null;
}

/**
 * Probes whether this browser can actually join the realtime topic.
 *
 * A WebSocket that connects proves nothing — the join is a message on top of it
 * and is separately authorised. The socket reported `101 Switching Protocols`
 * while nothing was ever delivered, and a subscribe callback that fires no
 * status at all is a hang rather than a refusal, so both are probed here: the
 * private channel the app uses, and the same topic without the private flag. If
 * one subscribes and the other does not, the `config.private` flag is the cause.
 */
export function subscribeToRealtimeHealth(
  onChange: (health: RealtimeHealth) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const state: RealtimeHealth = {
    private: "connecting",
    public: "connecting",
    error: null,
  };

  const supabase = createClient();

  const probe = (isPrivate: boolean) => {
    const channel = supabase.channel(
      REALTIME_CHANNEL,
      isPrivate ? { config: { private: true } } : undefined,
    );

    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        state[isPrivate ? "private" : "public"] = "connected";
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        state[isPrivate ? "private" : "public"] = "error";
        if (error?.message) {
          state.error = error.message;
          console.warn(`[Realtime] join refused: ${error.message}`);
        }
      }
      onChange({ ...state });
    });

    return channel;
  };

  const privateChannel = probe(true);
  const publicChannel = probe(false);

  onChange({ ...state });

  return () => {
    void supabase.removeChannel(privateChannel);
    void supabase.removeChannel(publicChannel);
  };
}

/**
 * Live table watcher for the admin panel (order tickets, rewards members).
 *
 * Uses Postgres Changes on the public topic, which respects table RLS: a signed
 * in admin receives every row, while an anonymous storefront browser only ever
 * receives its own. Nothing customer-identifying travels over the channel, so
 * this keeps the no-PII-on-broadcast rule intact.
 */
export function subscribeToTableChanges(
  tables: readonly string[],
  onChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = createClient();
  const channel = supabase.channel(REALTIME_CHANNEL, {
    config: { private: true },
  });

  tables.forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => onChange(),
    );
  });

  // Without a status callback a rejected join is completely silent: the page
  // simply stops updating and it reads like a data problem rather than a
  // connection one. The server's own wording is the most useful part, so it is
  // logged rather than just the status.
  channel.subscribe((status, error) => {
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.warn(
        `[Realtime] subscription to ${tables.join(", ")} failed: ${status}${
          error?.message ? ` — ${error.message}` : ""
        }`,
      );
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}
