import type { MenuCategory, OrderModifier } from "@/lib/types/database";

/**
 * A basket line, held in the browser until the customer submits it as a ticket.
 *
 * `unitPrice` is the item price plus the modifier prices, computed here in the
 * browser. Modifier prices are a hard-coded catalogue (see `product-sheet.tsx`)
 * rather than database rows, so a crafted request could send a different unit
 * price. That is accepted: no money changes hands online, the ticket is
 * display-only, and staff ring the basket up on their own till. Line and ticket
 * totals ARE recomputed in Postgres (see 0008_orders.sql).
 */
export interface CartLine {
  /** Local-only identity for React keys and de-duplication. */
  id: string;
  menuItemId: string;
  name: string;
  category: MenuCategory;
  size: string | null;
  modifiers: OrderModifier[];
  unitPrice: number;
  quantity: number;
}

/** Two lines merge when they are the same item with the same options. */
export function lineSignature(
  line: Omit<CartLine, "id" | "quantity">,
): string {
  const modifiers = [...line.modifiers]
    .map((modifier) => modifier.label)
    .sort()
    .join("|");
  return [line.menuItemId, line.size ?? "", modifiers].join("::");
}

export function lineTotal(line: CartLine): number {
  return round2(line.unitPrice * line.quantity);
}

export function cartTotal(lines: CartLine[]): number {
  return round2(lines.reduce((total, line) => total + lineTotal(line), 0));
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((count, line) => count + line.quantity, 0);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Reads a modifier list back out of the jsonb column without trusting it. */
export function parseModifiers(value: unknown): OrderModifier[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as { label?: unknown; price?: unknown };
    if (typeof candidate.label !== "string") return [];
    return [
      {
        label: candidate.label,
        price: typeof candidate.price === "number" ? candidate.price : 0,
      },
    ];
  });
}
