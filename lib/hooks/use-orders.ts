"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  deleteOrder,
  deleteOrderItem,
  fetchOrders,
  formatOrderNumber,
  updateOrder,
  updateOrderItemQuantity,
  type OrderEditInput,
} from "@/lib/orders";
import { broadcastRealtimeEvent, subscribeToTableChanges } from "@/lib/realtime";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/types/database";

export interface TicketLineEdit {
  /** itemId -> new quantity, for lines whose quantity changed. */
  quantities: Record<string, number>;
  /** itemIds the admin removed. */
  removedIds: string[];
}

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
        await updateOrder(order.id, { status });
        // Tell any customer watching this ticket to read it back.
        void broadcastRealtimeEvent("orders_updated");
        toast.success(
          `Ticket ${formatOrderNumber(order.order_number)} · ${ORDER_STATUS_LABELS[status].toLowerCase()}`,
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

  /**
   * Applies a correction to a ticket: its name, its note, its state, and any
   * line quantities or removals. Every write is followed by a reload rather than
   * a local patch, because the 0008 trigger recomputes item_count and subtotal
   * from the real rows — guessing at them locally would drift.
   */
  const saveTicket = React.useCallback(
    async (
      order: Order,
      fields: OrderEditInput,
      lineEdits: TicketLineEdit,
    ): Promise<boolean> => {
      setPendingIds((current) => [...current, order.id]);

      try {
        await updateOrder(order.id, fields);

        for (const item of order.order_items ?? []) {
          if (lineEdits.removedIds.includes(item.id)) continue;
          const next = lineEdits.quantities[item.id];
          if (typeof next === "number" && next !== item.quantity) {
            await updateOrderItemQuantity(item.id, next);
          }
        }

        for (const itemId of lineEdits.removedIds) {
          await deleteOrderItem(itemId);
        }

        await load();
        void broadcastRealtimeEvent("orders_updated");
        toast.success(`Ticket ${formatOrderNumber(order.order_number)} updated`);
        return true;
      } catch (err) {
        await load();
        toast.error("Could not update the ticket", {
          description: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setPendingIds((current) => current.filter((id) => id !== order.id));
      }
    },
    [load],
  );

  const removeOrder = React.useCallback(async (order: Order): Promise<boolean> => {
    const snapshot = ordersRef.current;
    setOrders((current) => current.filter((row) => row.id !== order.id));

    try {
      await deleteOrder(order.id);
      toast.success(`Ticket ${formatOrderNumber(order.order_number)} deleted`);
      return true;
    } catch (err) {
      setOrders(snapshot);
      toast.error("Could not delete the ticket", {
        description: err instanceof Error ? err.message : undefined,
      });
      return false;
    }
  }, []);

  return {
    orders,
    isLoading,
    error,
    pendingIds,
    reload: load,
    updateStatus,
    saveTicket,
    removeOrder,
  };
}
