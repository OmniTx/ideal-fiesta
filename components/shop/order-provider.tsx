"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  cancelOrder,
  DEFAULT_ORDERS_CONFIG,
  fetchMyOrders,
  isOrderActive,
  mergeOrdersConfig,
} from "@/lib/orders";
import { subscribeToOrderSignals } from "@/lib/realtime";
import { fetchSetting } from "@/lib/settings";
import type { Order, OrdersConfig } from "@/lib/types/database";

interface OrderContextValue {
  /** This device's tickets, newest first. RLS scopes the query. */
  orders: Order[];
  /** The ticket still being worked on, if there is one. */
  activeOrder: Order | null;
  ordersConfig: OrdersConfig;
  isTrackerOpen: boolean;
  openTracker: () => void;
  closeTracker: () => void;
  isCancelling: boolean;
  cancelActiveOrder: () => Promise<void>;
  /** Put a just-submitted ticket straight into local state, before refetching. */
  adoptOrder: (order: Order) => void;
  refresh: () => Promise<void>;
}

const OrderContext = React.createContext<OrderContextValue | null>(null);

/**
 * The device's own order tickets, so a customer can find their number again and
 * watch it move. Postgres Changes respects table RLS, so an anonymous browser
 * only ever receives changes to its own rows — this never leaks another
 * customer's ticket.
 */
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersConfig, setOrdersConfig] =
    React.useState<OrdersConfig>(DEFAULT_ORDERS_CONFIG);
  const [isTrackerOpen, setIsTrackerOpen] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const reloadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setOrders(await fetchMyOrders(20));
    } catch {
      // Non-fatal: tracking must never break the storefront.
    }
  }, []);

  React.useEffect(() => {
    void refresh();

    void (async () => {
      try {
        const saved = await fetchSetting<Partial<OrdersConfig>>("orders_config");
        setOrdersConfig(mergeOrdersConfig(saved));
      } catch {
        // Keep the defaults.
      }
    })();

    // A signal rather than Postgres Changes: an anonymous subscriber can never
    // be authorised to receive its own order rows, so the staff side broadcasts
    // "a ticket moved" and this device reads its own rows back by token.
    const unsubscribe = subscribeToOrderSignals(() => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => void refresh(), 500);
    });

    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      unsubscribe();
    };
  }, [refresh]);

  const activeOrder = React.useMemo(
    () => orders.find((order) => isOrderActive(order.status)) ?? null,
    [orders],
  );

  const hasActiveOrder = Boolean(activeOrder);

  // The phone is the one that must not need a refresh. A broadcast can be
  // missed, so while a ticket is in flight also poll: it is one small RPC, and
  // the worst case becomes fifteen seconds rather than "until you reload".
  // Keyed on a boolean, not the order object, so refetching cannot restart the
  // interval before it ever fires.
  React.useEffect(() => {
    if (!hasActiveOrder) return;
    const poll = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(poll);
  }, [hasActiveOrder, refresh]);

  const adoptOrder = React.useCallback((order: Order) => {
    setOrders((current) => [order, ...current.filter((row) => row.id !== order.id)]);
  }, []);

  const cancelActiveOrder = React.useCallback(async () => {
    if (!activeOrder) return;
    setIsCancelling(true);
    try {
      const updated = await cancelOrder(activeOrder.id);
      setOrders((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      toast.success("Ticket cancelled", {
        description: "Nothing has been charged — you can build a new basket any time.",
      });
    } catch (error) {
      toast.error("Could not cancel the ticket", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsCancelling(false);
    }
  }, [activeOrder]);

  const value = React.useMemo<OrderContextValue>(
    () => ({
      orders,
      activeOrder,
      ordersConfig,
      isTrackerOpen,
      openTracker: () => setIsTrackerOpen(true),
      closeTracker: () => setIsTrackerOpen(false),
      isCancelling,
      cancelActiveOrder,
      adoptOrder,
      refresh,
    }),
    [
      orders,
      activeOrder,
      ordersConfig,
      isTrackerOpen,
      isCancelling,
      cancelActiveOrder,
      adoptOrder,
      refresh,
    ],
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useMyOrders(): OrderContextValue {
  const context = React.useContext(OrderContext);
  if (!context) throw new Error("useMyOrders must be used inside OrderProvider");
  return context;
}
