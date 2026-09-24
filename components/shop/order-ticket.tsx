"use client";

import * as React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatAUD } from "@/lib/money";
import { customerStatusLabel, formatOrderNumber } from "@/lib/orders";
import { formatVenueTime } from "@/lib/time";
import { CUSTOMER_ORDER_STEPS, type Order } from "@/lib/types/database";

interface OrderTicketProps {
  order: Order;
  counterMessage: string;
  canCancel: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  onDone: () => void;
}

/** Where the ticket has got to. Cancelled replaces the timeline entirely. */
function StatusTimeline({ order }: { order: Order }) {
  const currentIndex = CUSTOMER_ORDER_STEPS.findIndex(
    (step) => step.value === order.status,
  );

  return (
    <ol className="flex items-center gap-2" aria-label="Order progress">
      {CUSTOMER_ORDER_STEPS.map((step, index) => {
        const reached = currentIndex >= index && currentIndex !== -1;
        return (
          <li key={step.value} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full ${
                reached ? "bg-primary" : "bg-border"
              }`}
              aria-hidden="true"
            />
            <span
              className={`text-[11px] font-medium ${
                reached ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-current={step.value === order.status ? "step" : undefined}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTicket({
  order,
  counterMessage,
  canCancel,
  isCancelling,
  onCancel,
  onDone,
}: OrderTicketProps) {
  const items = order.order_items ?? [];
  const isCancelled = order.status === "void" || order.status === "cancelled";

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-2 px-6 pt-7 pb-6 text-center">
        {isCancelled ? (
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <XCircle className="h-6 w-6" />
          </span>
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </span>
        )}

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

        {isCancelled ? (
          <p className="mt-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            This ticket was cancelled
          </p>
        ) : (
          <p className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {customerStatusLabel(order.status)}
          </p>
        )}
      </div>

      {!isCancelled ? (
        <div className="px-6 pb-5">
          <StatusTimeline order={order} />
        </div>
      ) : null}

      <div className="border-t border-border px-6 py-5">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 py-2.5"
            >
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

        {!isCancelled ? (
          <p className="mt-5 rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
            {counterMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-border p-6">
        {canCancel && !isCancelled ? (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isCancelling}
            className="w-full"
          >
            {isCancelling ? "Cancelling…" : "Changed my mind — cancel"}
          </Button>
        ) : null}

        <Button onClick={onDone} className="w-full">
          {canCancel && !isCancelled ? "Keep my order" : "Done"}
        </Button>
      </div>
    </div>
  );
}
