"use client";

import * as React from "react";
import { ReceiptText } from "lucide-react";

import { OrderTicket } from "@/components/shop/order-ticket";
import { useMyOrders } from "@/components/shop/order-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { canCancelOrder, customerStatusLabel, formatOrderNumber } from "@/lib/orders";

/**
 * The device's ticket. Falls back to the most recent one when nothing is active,
 * which is what makes the cancelled state visible immediately after cancelling
 * instead of the dialog going blank.
 */
export function OrderTrackerDialog() {
  const {
    orders,
    activeOrder,
    ordersConfig,
    isTrackerOpen,
    closeTracker,
    isCancelling,
    cancelActiveOrder,
  } = useMyOrders();

  const order = activeOrder ?? orders[0] ?? null;

  return (
    <Dialog
      open={isTrackerOpen}
      onOpenChange={(open) => (open ? undefined : closeTracker())}
    >
      <DialogContent className="max-w-md overflow-hidden p-0">
        {order ? (
          <>
            {/* The ticket is mostly numbers and labels, so there is no visible
                heading to hand Radix — it still needs one, and a description,
                to announce the dialog properly. */}
            <DialogTitle className="sr-only">
              Your order {formatOrderNumber(order.order_number)}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {customerStatusLabel(order.status)}. Show this number at the
              counter to pay.
            </DialogDescription>
            <OrderTicket
              order={order}
              counterMessage={ordersConfig.counter_message}
              canCancel={canCancelOrder(
                order,
                ordersConfig.cancel_window_minutes,
              )}
              isCancelling={isCancelling}
              onCancel={() => void cancelActiveOrder()}
              onDone={closeTracker}
            />
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>No ticket yet</DialogTitle>
              <DialogDescription>
                Build a basket from the menu and your order number will appear
                here, with its progress.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <ReceiptText className="h-5 w-5" />
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
