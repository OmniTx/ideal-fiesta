"use client";

import * as React from "react";

import { subscribeToRealtimeHealth, type RealtimeStatus } from "@/lib/realtime";
import { cn } from "@/lib/utils";

const LABELS: Record<RealtimeStatus, string> = {
  connecting: "Connecting",
  connected: "Live",
  error: "Offline",
};

const DOTS: Record<RealtimeStatus, string> = {
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
  error: "bg-destructive",
};

const TITLES: Record<RealtimeStatus, string> = {
  connecting: "Opening the live connection…",
  connected: "Live updates are connected.",
  error:
    "Live updates are NOT connected — the server refused this browser's channel join. Pages still refresh on a timer, so nothing is lost, but the realtime feature is off.",
};

/**
 * Whether live updates are actually connected.
 *
 * Deliberately in the header on every admin page: realtime failing quietly is
 * what made this hard to pin down, and staff should be able to see the state of
 * the connection without opening a developer console.
 */
export function RealtimeStatusBadge() {
  const [status, setStatus] = React.useState<RealtimeStatus>("connecting");

  React.useEffect(() => subscribeToRealtimeHealth(setStatus), []);

  return (
    <span
      title={TITLES[status]}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground"
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", DOTS[status])}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">{LABELS[status]}</span>
      <span className="sr-only">
        Realtime: {LABELS[status]}. {TITLES[status]}
      </span>
    </span>
  );
}
