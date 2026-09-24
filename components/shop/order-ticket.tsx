"use client";

import * as React from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatAUD } from "@/lib/money";
import { formatOrderNumber } from "@/lib/orders";
import { formatVenueTime } from "@/lib/time";
import type { Order } from "@/lib/types/database";

interface OrderTicketProps {
  order: Order;
  counterMessage: string;
  onDone: () => void;
}

/** What the customer shows at the counter. */
export function OrderTicket({
  order,
  counterMessage,
  onDone,
}: OrderTicketProps) {
  const items = order.order_items ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col items-center gap-2 border-b border-border px-6 py-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Your order number
        </p>
        <p className="font-display text-6xl font-black tracking-tight text-foreground">
          {formatOrderNumber(order.order_number)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatVenueTime(new Date(order.created_at), {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="px-6 py-5">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 py-2.5">
              <span className="text-sm text-foreground">
                <span className="font-semibold tabular-nums">
                  {item.quantity} ×
                </span>{" "}
                {item.size ? `${item.size} ` : ""}
                {item.name}
                {item.modifiers.length > 0 ? (
                  <span className="block text-xs text-muted-foreground">
                    {item.modifiers.map((modifier) => modifier.label).join(", ")}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {formatAUD(item.line_total)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold">Basket total</span>
          <span className="font-display text-2xl font-bold tabular-nums">
            {formatAUD(order.subtotal)}
          </span>
        </div>

        <p className="mt-5 rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
          {counterMessage}
        </p>
      </div>

      <div className="mt-auto border-t border-border p-6">
        <Button onClick={onDone} className="w-full">
          Start a new basket
        </Button>
      </div>
    </div>
  );
}
