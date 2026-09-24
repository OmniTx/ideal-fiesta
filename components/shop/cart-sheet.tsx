"use client";

import * as React from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/shop/cart-provider";
import { OrderTicket } from "@/components/shop/order-ticket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAUD } from "@/lib/money";
import { submitOrder } from "@/lib/orders";
import type { Order } from "@/lib/types/database";

/**
 * Slide-out basket. Submitting turns it into a counter ticket — the customer
 * shows the number, staff ring the basket up on their own till.
 */
export function CartSheet() {
  const {
    lines,
    count,
    total,
    isOpen,
    closeCart,
    setQuantity,
    removeLine,
    clear,
    ordersConfig,
  } = useCart();

  const [customerName, setCustomerName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [ticket, setTicket] = React.useState<Order | null>(null);

  const close = () => {
    if (ticket) setTicket(null);
    closeCart();
  };

  const submit = async () => {
    if (lines.length === 0) return;
    setIsSubmitting(true);
    try {
      const order = await submitOrder({ lines, customerName, note });
      setTicket(order);
      clear();
      setCustomerName("");
      setNote("");
    } catch (error) {
      toast.error("Could not submit your basket", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      // `inert` keeps the closed basket out of the tab order as well as out of
      // the accessibility tree; `aria-hidden` alone would leave its controls
      // focusable, which browsers now block.
      inert={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />

      <div
        className={`absolute top-0 right-0 bottom-0 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Your basket"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="font-display text-base font-semibold">
              {ticket ? "Your ticket" : "Your basket"}
            </span>
            {!ticket && count > 0 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                {count}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            onClick={close}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted"
            aria-label="Close basket"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {ticket ? (
          <OrderTicket
            order={ticket}
            counterMessage={ordersConfig.counter_message}
            onDone={close}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <p className="font-medium">Your basket is empty</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Tap any menu item to choose a size and options, then add it
                    here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {line.size ? `${line.size} ` : ""}
                          {line.name}
                        </p>
                        {line.modifiers.length > 0 ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {line.modifiers
                              .map((modifier) => modifier.label)
                              .join(", ")}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                          {formatAUD(line.unitPrice)} each
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatAUD(line.unitPrice * line.quantity)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.id, line.quantity - 1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground transition hover:bg-muted"
                            aria-label={`Reduce ${line.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.id, line.quantity + 1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground transition hover:bg-muted"
                            aria-label={`Add another ${line.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="ml-1 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remove ${line.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {lines.length > 0 ? (
                <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cart-name">Name (optional)</Label>
                    <Input
                      id="cart-name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="So we can call it out"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cart-note">Anything to note? (optional)</Label>
                    <Textarea
                      id="cart-note"
                      rows={2}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Allergies, no sugar, extra hot…"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {lines.length > 0 ? (
              <div className="border-t border-border p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">Basket total</span>
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {formatAUD(total)}
                  </span>
                </div>
                <Button
                  onClick={submit}
                  disabled={isSubmitting || !ordersConfig.enabled}
                  className="mt-4 w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {ordersConfig.enabled
                    ? "Get my order number"
                    : "Baskets are paused right now"}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  You pay at the counter — nothing is charged here.
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
