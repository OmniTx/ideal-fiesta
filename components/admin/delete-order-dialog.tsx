"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAUD } from "@/lib/money";
import { formatOrderNumber } from "@/lib/orders";
import type { Order } from "@/lib/types/database";

interface DeleteOrderDialogProps {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (order: Order) => Promise<boolean>;
}

/**
 * Deleting is deliberately separate from "Void": void keeps the ticket on the
 * board for the day's record, whereas this removes it and its lines for good.
 */
export function DeleteOrderDialog({
  order,
  onOpenChange,
  onConfirm,
}: DeleteOrderDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const confirm = async () => {
    if (!order) return;
    setIsDeleting(true);
    const ok = await onConfirm(order);
    setIsDeleting(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Delete ticket {order ? formatOrderNumber(order.order_number) : ""}
          </DialogTitle>
          <DialogDescription>
            {order
              ? `${order.item_count} ${
                  order.item_count === 1 ? "item" : "items"
                } · ${formatAUD(order.subtotal)} — the ticket and its lines are removed permanently. To keep it on the day's record, void it instead.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Keep ticket
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
