"use client";

import * as React from "react";

import {
  subscribeToRealtimeHealth,
  type RealtimeHealth,
  type RealtimeStatus,
} from "@/lib/realtime";
import { cn } from "@/lib/utils";

const INITIAL: RealtimeHealth = {
  private: "connecting",
  public: "connecting",
  error: null,
};

const DOTS: Record<RealtimeStatus, string> = {
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
  error: "bg-destructive",
};

function label(health: RealtimeHealth): { text: string; tone: RealtimeStatus } {
  if (health.private === "connected") return { text: "Live", tone: "connected" };
  if (health.private === "error") return { text: "Offline", tone: "error" };
  return { text: "No join", tone: "connecting" };
}

function explain(health: RealtimeHealth): string {
  const { private: priv, public: pub, error } = health;

  if (priv === "connected") {
    return "Live updates are connected.";
  }

  const parts: string[] = [];

  if (priv === "error") {
    parts.push("The server refused this browser's private channel join.");
  } else if (pub === "connected") {
    parts.push(
      "A public channel to the same topic joined, but the private one did not — so the private flag is the cause.",
    );
  } else if (pub === "error") {
    parts.push("Both the private and public channel joins were refused.");
  } else {
    parts.push(
      "Neither join returned a status at all, which is a hang rather than a refusal.",
    );
  }

  if (error) parts.push(`Server said: ${error}`);

  parts.push("Pages still refresh on a timer, so nothing is lost.");
  return parts.join(" ");
}

/**
 * Whether live updates are actually connected.
 *
 * Deliberately in the header on every admin page: realtime failing quietly is
 * what made this hard to pin down, and staff should be able to see the state of
 * the connection without opening a developer console.
 */
export function RealtimeStatusBadge() {
  const [health, setHealth] = React.useState<RealtimeHealth>(INITIAL);

  React.useEffect(() => subscribeToRealtimeHealth(setHealth), []);

  const { text, tone } = label(health);
  const description = explain(health);

  return (
    <span
      title={description}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground"
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", DOTS[tone])}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">{text}</span>
      <span className="sr-only">
        Realtime: {text}. {description}
      </span>
    </span>
  );
}
