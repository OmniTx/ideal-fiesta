"use client";

import * as React from "react";
import Link from "next/link";
import { MonitorPlay, ReceiptText, RefreshCw } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteOrderDialog } from "@/components/admin/delete-order-dialog";
import { OrderEditDialog } from "@/components/admin/order-edit-dialog";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrders } from "@/lib/hooks/use-orders";
import { venueDateString } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types/database";

type OrdersFilter = "today" | "open" | "all";

const FILTERS: { value: OrdersFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
];

export default function AdminOrdersPage() {
  const {
    orders,
    isLoading,
    error,
    pendingIds,
    reload,
    updateStatus,
    saveTicket,
    removeOrder,
  } = useOrders();
  const [filter, setFilter] = React.useState<OrdersFilter>("today");
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = React.useState<Order | null>(null);

  const today = venueDateString();
  const visible = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "open") return order.status === "new";
    return order.order_day === today;
  });

  return (
    <div className="flex flex-col gap-5 pb-16">
      <AdminPageHeader
        title="Order tickets"
        description="Baskets customers built on their phones. Staff ring these up at the till."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reload()}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
            <Link
              href="/admin/orders/board"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/85"
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              <span>Bench board</span>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
          const isActive = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={isActive}
              className={cn(
                "touch-target inline-flex shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!error && isLoading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-28 w-full animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : null}

      {!error && !isLoading && visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">
                {filter === "all"
                  ? "No tickets yet"
                  : filter === "open"
                    ? "No open tickets"
                    : "No tickets today"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                When a customer submits their basket, the ticket lands here and
                on the bench board.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!error && !isLoading && visible.length > 0 ? (
        <OrdersTable
          orders={visible}
          pendingIds={pendingIds}
          onStatusChange={(order, status) => void updateStatus(order, status)}
          onEdit={setEditingOrder}
          onDelete={setDeletingOrder}
        />
      ) : null}

      <OrderEditDialog
        order={editingOrder}
        onOpenChange={(open) => {
          if (!open) setEditingOrder(null);
        }}
        onSave={saveTicket}
      />

      <DeleteOrderDialog
        order={deletingOrder}
        onOpenChange={(open) => {
          if (!open) setDeletingOrder(null);
        }}
        onConfirm={removeOrder}
      />
    </div>
  );
}
