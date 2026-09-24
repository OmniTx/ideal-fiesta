"use client";

import * as React from "react";
import { toast } from "sonner";

import { fetchOrders, formatOrderNumber, setOrderStatus } from "@/lib/orders";
import { subscribeToTableChanges } from "@/lib/realtime";
import type { Order, OrderStatus } from "@/lib/types/database";

/**
 * Counter tickets for the admin (and, on the storefront, this device's own
 * tickets — RLS scopes the same query). Mirrors the optimistic pattern in
 * `use-menu-items`: patch locally, persist, roll back the snapshot on failure.
 *
 * Postgres Changes fires once per item plus once per recount, so realtime
 * reloads are debounced into a single refetch.
 */
export function useOrders({ live = true }: { live?: boolean } = {}) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);

  const ordersRef = React.useRef<Order[]>([]);
  const reloadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const load = React.useCallback(async () => {
    try {
      const rows = await fetchOrders();
      setOrders(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    if (!live) return;

    const unsubscribe = subscribeToTableChanges(
      ["orders", "order_items"],
      () => {
        if (reloadTimer.current) clearTimeout(reloadTimer.current);
        reloadTimer.current = setTimeout(() => void load(), 800);
      },
    );

    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      unsubscribe();
    };
  }, [load, live]);

  const updateStatus = React.useCallback(
    async (order: Order, status: OrderStatus): Promise<boolean> => {
      const snapshot = ordersRef.current;
      setOrders((current) =>
        current.map((row) =>
          row.id === order.id
            ? {
                ...row,
                status,
                served_at:
                  status === "served" ? new Date().toISOString() : row.served_at,
              }
            : row,
        ),
      );
      setPendingIds((current) => [...current, order.id]);

      try {
        await setOrderStatus(order.id, status);
        toast.success(
          status === "served"
            ? `Ticket ${formatOrderNumber(order.order_number)} marked served`
            : `Ticket ${formatOrderNumber(order.order_number)} voided`,
        );
        return true;
      } catch (err) {
        setOrders(snapshot);
        toast.error("Could not update the ticket", {
          description: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setPendingIds((current) => current.filter((id) => id !== order.id));
      }
    },
    [],
  );

  return { orders, isLoading, error, pendingIds, reload: load, updateStatus };
}
