"use client";

import * as React from "react";
import { ReceiptText, ChevronRight } from "lucide-react";

import { useMyOrders } from "@/components/shop/order-provider";
import { customerStatusLabel, formatOrderNumber } from "@/lib/orders";

/**
 * Persistent way back to an in-flight ticket. Without this the number is only
 * visible in the moment it is submitted, which is no use to someone who wants to
 * check on it two minutes later.
 *
 * Hidden while the tracker is open, and the rewards nudge yields to it, so the
 * two never stack in the same corner of a phone screen.
 */
export function ActiveOrderBar() {
  const { activeOrder, isTrackerOpen, openTracker } = useMyOrders();

  if (!activeOrder || isTrackerOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md animate-slide-up">
      <button
        type="button"
        onClick={openTracker}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-foreground p-3.5 text-left text-background shadow-xl backdrop-blur-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <ReceiptText className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold">
            Order {formatOrderNumber(activeOrder.order_number)} ·{" "}
            {customerStatusLabel(activeOrder.status)}
          </span>
          <span className="block truncate text-[11px] text-background/80">
            {activeOrder.item_count}{" "}
            {activeOrder.item_count === 1 ? "item" : "items"} · tap to watch your
            ticket
          </span>
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-background/70" />
      </button>
    </div>
  );
}
