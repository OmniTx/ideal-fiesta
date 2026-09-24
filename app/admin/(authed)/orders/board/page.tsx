"use client";

import * as React from "react";

import { OrdersBoard } from "@/components/admin/orders-board";
import { useOrders } from "@/lib/hooks/use-orders";
import { fetchSetting } from "@/lib/settings";
import { mergeOrdersConfig } from "@/lib/orders";
import type { OrdersConfig } from "@/lib/types/database";

/**
 * Full-bleed kiosk view for a tablet on the bench. Deliberately outside the
 * normal page chrome — no sidebar on this route would be ideal, but the shell is
 * shared, so the board just uses the full content width and large type.
 */
export default function AdminOrdersBoardPage() {
  const { orders, pendingIds, updateStatus, lastLoadedAt } = useOrders();
  const [config, setConfig] = React.useState<OrdersConfig | null>(null);

  React.useEffect(() => {
    let isActive = true;
    void (async () => {
      try {
        const saved = await fetchSetting<Partial<OrdersConfig>>("orders_config");
        if (isActive) setConfig(mergeOrdersConfig(saved));
      } catch {
        if (isActive) setConfig(mergeOrdersConfig(null));
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="-mx-4 sm:-mx-6">
      <OrdersBoard
        orders={orders}
        pendingIds={pendingIds}
        onStatusChange={(order, status) => void updateStatus(order, status)}
        title={config?.board_title ?? "Today's tickets"}
        lastLoadedAt={lastLoadedAt}
      />
    </div>
  );
}
