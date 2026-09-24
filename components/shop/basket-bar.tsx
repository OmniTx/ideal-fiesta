"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/shop/cart-provider";
import { formatAUD } from "@/lib/money";

/** Only the pages where you can actually add something. */
const BASKET_PAGES = ["/menu", "/specials"];

/**
 * Basket summary pinned to the bottom of the menu pages.
 *
 * The header button is a small target at the top of a long scrolling list, so on
 * a phone the basket was easy to lose track of after adding something. This puts
 * it where the thumb already is. It sits inside the storefront's bottom stack
 * (see the shop layout) along with the active-order bar, so the two never
 * overlap.
 */
export function BasketBar() {
  const { count, total, isOpen, openCart } = useCart();
  const pathname = usePathname();

  if (!BASKET_PAGES.includes(pathname)) return null;
  if (count === 0 || isOpen) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      className="pointer-events-auto mx-auto flex w-full max-w-md animate-slide-up items-center gap-3 rounded-2xl bg-primary p-3.5 text-left text-primary-foreground shadow-xl transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
        <ShoppingBag className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
          {count}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">
          {count} {count === 1 ? "item" : "items"} in your basket
        </span>
        <span className="block text-[11px] text-primary-foreground/85">
          {formatAUD(total)} · tap to review and get your order number
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-primary-foreground/70" />
    </button>
  );
}
