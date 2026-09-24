"use client";

import * as React from "react";
import { Bell, BellOff, Check, ChefHat, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAUD } from "@/lib/money";
import { formatOrderNumber, isOrderActive } from "@/lib/orders";
import { formatVenueTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/types/database";

interface OrdersBoardProps {
  orders: Order[];
  pendingIds: string[];
  onStatusChange: (order: Order, status: OrderStatus) => void;
  title: string;
}

function itemLine(item: OrderItem): string {
  const options = item.modifiers.map((modifier) => modifier.label).join(", ");
  const size = item.size ? `${item.size} · ` : "";
  return `${item.quantity} × ${size}${item.name}${options ? ` (${options})` : ""}`;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/**
 * Kiosk display for the bench: read-only apart from marking a ticket served.
 *
 * The chime is synthesised rather than loaded from a file, but browsers block
 * audio until the page has had a user gesture — hence the explicit "Enable
 * sound" tap, which creates and keeps the one AudioContext the chime reuses.
 */
export function OrdersBoard({
  orders,
  pendingIds,
  onStatusChange,
  title,
}: OrdersBoardProps) {
  const audioRef = React.useRef<AudioContext | null>(null);
  const knownIdsRef = React.useRef<Set<string> | null>(null);
  const [soundOn, setSoundOn] = React.useState(false);

  const enableSound = () => {
    const context = audioRef.current ?? getAudioContext();
    if (!context) return;
    audioRef.current = context;
    void context.resume();
    setSoundOn(true);
  };

  const chime = React.useCallback(() => {
    const context = audioRef.current;
    if (!context) return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1180, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.6);
    } catch {
      // Audio is a nicety, never a failure path.
    }
  }, []);

  // Chime once per genuinely new ticket, not on every status change.
  React.useEffect(() => {
    const ids = new Set(orders.map((order) => order.id));
    const previous = knownIdsRef.current;

    if (previous === null) {
      knownIdsRef.current = ids;
      return;
    }

    const hasNewTicket = orders.some((order) => !previous.has(order.id));
    knownIdsRef.current = ids;

    if (hasNewTicket && soundOn) chime();
  }, [orders, soundOn, chime]);

  const openTickets = orders.filter((order) => isOrderActive(order.status));
  const justServed = orders
    .filter((order) => order.status === "served")
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {openTickets.length} open ·{" "}
            {formatVenueTime(new Date(), {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={enableSound}
          disabled={soundOn}
          className={cn(
            "touch-target inline-flex items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
            soundOn
              ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          {soundOn ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          {soundOn ? "Sound on" : "Enable sound"}
        </button>
      </div>

      {openTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 py-20 text-center">
          <p className="font-display text-xl font-semibold text-muted-foreground">
            No open tickets
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New baskets appear here the moment a customer submits one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {openTickets.map((order) => {
            const isPending = pendingIds.includes(order.id);
            return (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-4xl font-black tabular-nums leading-none text-foreground">
                    {formatOrderNumber(order.order_number)}
                  </span>
                  <div className="text-right">
                    <Badge
                      variant={order.status === "new" ? "default" : "secondary"}
                      className="text-[10px] uppercase"
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatVenueTime(new Date(order.created_at), {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                  {(order.order_items ?? []).map((item) => (
                    <li key={item.id} className="text-sm leading-snug text-foreground">
                      {itemLine(item)}
                    </li>
                  ))}
                </ul>

                {order.customer_name ? (
                  <p className="text-sm font-medium text-foreground">
                    {order.customer_name}
                  </p>
                ) : null}

                {order.note ? (
                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                    <span className="font-semibold">Note:</span> {order.note}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="font-display text-xl font-bold tabular-nums">
                    {formatAUD(order.subtotal)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(order, "void")}
                      disabled={isPending}
                      className="h-11 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Void
                    </Button>
                    {order.status === "new" ? (
                      <Button
                        size="sm"
                        onClick={() => onStatusChange(order, "preparing")}
                        disabled={isPending}
                        className="h-11 gap-1.5 text-sm"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ChefHat className="h-4 w-4" />
                        )}
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onStatusChange(order, "served")}
                        disabled={isPending}
                        className="h-11 gap-1.5 text-sm"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Served
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {justServed.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recently served
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {justServed.map((order) => (
              <li
                key={order.id}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold tabular-nums text-muted-foreground"
              >
                {formatOrderNumber(order.order_number)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
