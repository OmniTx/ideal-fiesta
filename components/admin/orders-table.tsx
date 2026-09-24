"use client";

import * as React from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAUD } from "@/lib/money";
import { formatOrderNumber } from "@/lib/orders";
import { formatVenueTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types/database";

interface OrdersTableProps {
  orders: Order[];
  pendingIds: string[];
  onStatusChange: (order: Order, status: "served" | "void") => void;
}

function itemLine(item: OrderItem): string {
  const options = item.modifiers.map((modifier) => modifier.label).join(", ");
  const size = item.size ? `${item.size} · ` : "";
  return `${item.quantity} × ${size}${item.name}${options ? ` (${options})` : ""}`;
}

export function OrdersTable({
  orders,
  pendingIds,
  onStatusChange,
}: OrdersTableProps) {
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => {
        const isPending = pendingIds.includes(order.id);
        const items = order.order_items ?? [];

        return (
          <li
            key={order.id}
            className={cn(
              "rounded-xl border bg-card p-4 shadow-sm transition",
              order.status === "new"
                ? "border-primary/40"
                : "border-border opacity-80",
              order.status === "void" && "opacity-50",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold tabular-nums text-foreground">
                  {formatOrderNumber(order.order_number)}
                </span>
                <Badge
                  variant={
                    order.status === "new"
                      ? "default"
                      : order.status === "void"
                        ? "destructive"
                        : "muted"
                  }
                  className="text-[10px] uppercase"
                >
                  {order.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatVenueTime(new Date(order.created_at), {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {order.customer_name ? (
                  <span className="text-xs font-medium text-foreground">
                    {order.customer_name}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tabular-nums">
                  {formatAUD(order.subtotal)}
                </span>

                {order.status === "new" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onStatusChange(order, "served")}
                      disabled={isPending}
                      className="h-9 gap-1.5 text-xs"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Served
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(order, "void")}
                      disabled={isPending}
                      className="h-9 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Void
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(order, "served")}
                    disabled={isPending || order.status === "served"}
                    className="h-9 gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen
                  </Button>
                )}
              </div>
            </div>

            {items.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="text-foreground">{itemLine(item)}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatAUD(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {order.item_count} {order.item_count === 1 ? "item" : "items"} ·
                line details unavailable
              </p>
            )}

            {order.note ? (
              <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-foreground">
                <span className="font-semibold">Note:</span> {order.note}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
