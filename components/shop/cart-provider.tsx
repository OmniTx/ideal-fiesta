"use client";

import * as React from "react";

import { cartCount, cartTotal, lineSignature, type CartLine } from "@/lib/cart";
import { DEFAULT_ORDERS_CONFIG, mergeOrdersConfig } from "@/lib/orders";
import { fetchSetting } from "@/lib/settings";
import type { OrdersConfig } from "@/lib/types/database";

const CART_KEY = "foundry_cart_v1";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  isReady: boolean;
  isOpen: boolean;
  ordersConfig: OrdersConfig;
  addLine: (line: Omit<CartLine, "id" | "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

/**
 * The basket, shared by the product sheet, the header badge and the cart panel,
 * and persisted to localStorage so it survives a reload on the walk to the
 * counter. Prices here are display values — Postgres recomputes every total.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [isReady, setIsReady] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [ordersConfig, setOrdersConfig] = React.useState<OrdersConfig>(
    DEFAULT_ORDERS_CONFIG,
  );

  // Read after mount only: the server has no basket, so doing this in the initial
  // render would produce a hydration mismatch.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      }
    } catch {
      // A corrupt basket is not worth failing a page load over.
    }
    setIsReady(true);
  }, []);

  React.useEffect(() => {
    if (!isReady) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      // Storage full or blocked — the basket just won't survive a reload.
    }
  }, [lines, isReady]);

  React.useEffect(() => {
    let isActive = true;
    void (async () => {
      try {
        const saved = await fetchSetting<Partial<OrdersConfig>>("orders_config");
        if (isActive) setOrdersConfig(mergeOrdersConfig(saved));
      } catch {
        // Keep the defaults.
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  // Lock the page behind the panel, matching the storefront drawer.
  React.useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const addLine = React.useCallback(
    (line: Omit<CartLine, "id" | "quantity">, quantity = 1) => {
      setLines((current) => {
        const signature = lineSignature(line);
        const index = current.findIndex(
          (row) => lineSignature(row) === signature,
        );

        if (index === -1) {
          return [
            ...current,
            {
              ...line,
              id: `${Date.now().toString(36)}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
              quantity,
            },
          ];
        }

        const next = [...current];
        next[index] = {
          ...next[index],
          quantity: Math.min(20, next[index].quantity + quantity),
        };
        return next;
      });
    },
    [],
  );

  const setQuantity = React.useCallback((id: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) =>
            line.id === id
              ? { ...line, quantity: Math.min(20, quantity) }
              : line,
          ),
    );
  }, []);

  const removeLine = React.useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const value = React.useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      total: cartTotal(lines),
      isReady,
      isOpen,
      ordersConfig,
      addLine,
      setQuantity,
      removeLine,
      clear,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [lines, isReady, isOpen, ordersConfig, addLine, setQuantity, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
