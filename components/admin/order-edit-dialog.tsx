"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TicketLineEdit } from "@/lib/hooks/use-orders";
import { formatAUD } from "@/lib/money";
import { formatOrderNumber, type OrderEditInput } from "@/lib/orders";
import { formatVenueTime } from "@/lib/time";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/types/database";

interface OrderEditDialogProps {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onSave: (
    order: Order,
    fields: OrderEditInput,
    lineEdits: TicketLineEdit,
  ) => Promise<boolean>;
}

function itemLabel(item: OrderItem): string {
  const options = item.modifiers.map((modifier) => modifier.label).join(", ");
  const size = item.size ? `${item.size} · ` : "";
  return `${size}${item.name}${options ? ` (${options})` : ""}`;
}

/**
 * Correct a ticket: the customer's name, the note, the state, and the lines
 * themselves. Totals are never edited by hand — removing a line or changing a
 * quantity makes the 0008 trigger recount the ticket.
 */
export function OrderEditDialog({
  order,
  onOpenChange,
  onSave,
}: OrderEditDialogProps) {
  const [customerName, setCustomerName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus>("new");
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const [removedIds, setRemovedIds] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!order) return;
    setCustomerName(order.customer_name ?? "");
    setNote(order.note ?? "");
    setStatus(order.status);
    setQuantities(
      Object.fromEntries(
        (order.order_items ?? []).map((item) => [item.id, item.quantity]),
      ),
    );
    setRemovedIds([]);
  }, [order]);

  if (!order) return null;

  const items = order.order_items ?? [];
  const keptItems = items.filter((item) => !removedIds.includes(item.id));
  const previewTotal = keptItems.reduce(
    (total, item) => total + item.unit_price * (quantities[item.id] ?? item.quantity),
    0,
  );
  const wouldEmptyTicket = items.length > 0 && keptItems.length === 0;

  const submit = async () => {
    setIsSaving(true);
    const ok = await onSave(
      order,
      { customer_name: customerName, note, status },
      { quantities, removedIds },
    );
    setIsSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Edit ticket {formatOrderNumber(order.order_number)}
          </DialogTitle>
          <DialogDescription>
            Submitted{" "}
            {formatVenueTime(new Date(order.created_at), {
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Totals recalculate from the lines you keep.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-name">Name</Label>
              <Input
                id="ticket-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="No name"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-status">State</Label>
              <Select
                id="ticket-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as OrderStatus)
                }
              >
                {ORDER_STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {ORDER_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-note">Note</Label>
            <Textarea
              id="ticket-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Allergies, no sugar, extra hot…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Lines</Label>

            {items.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                This ticket has no line details recorded.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {items.map((item) => {
                  const isRemoved = removedIds.includes(item.id);
                  const quantity = quantities[item.id] ?? item.quantity;

                  return (
                    <li
                      key={item.id}
                      className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 ${
                        isRemoved ? "opacity-45" : ""
                      }`}
                    >
                      <span
                        className={`min-w-0 flex-1 text-sm ${
                          isRemoved ? "line-through" : ""
                        }`}
                      >
                        {itemLabel(item)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <span className="w-16 text-right text-sm font-semibold tabular-nums">
                          {formatAUD(item.unit_price * quantity)}
                        </span>

                        <button
                          type="button"
                          disabled={isRemoved || quantity <= 1}
                          onClick={() =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: Math.max(1, quantity - 1),
                            }))
                          }
                          className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                          aria-label={`Reduce ${item.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isRemoved || quantity >= 20}
                          onClick={() =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: Math.min(20, quantity + 1),
                            }))
                          }
                          className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                          aria-label={`Add another ${item.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setRemovedIds((current) =>
                              isRemoved
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id],
                            )
                          }
                          className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label={
                            isRemoved
                              ? `Keep ${item.name}`
                              : `Remove ${item.name}`
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {wouldEmptyTicket ? (
              <p role="alert" className="text-xs text-destructive">
                A ticket needs at least one line. Delete the ticket instead.
              </p>
            ) : null}
          </div>

          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">New total</span>
            <span className="font-display text-xl font-bold tabular-nums">
              {formatAUD(previewTotal)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={isSaving || wouldEmptyTicket}
          >
            Save ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
