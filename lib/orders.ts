import { getVisitorSecret } from "@/lib/visitor-identity";
import { createClient } from "@/utils/supabase/client";
import type { CartLine } from "@/lib/cart";
import type {
  Order,
  OrdersConfig,
  OrderStatus,
} from "@/lib/types/database";

export const DEFAULT_ORDERS_CONFIG: OrdersConfig = {
  enabled: true,
  counter_message:
    "Show your order number at the counter and we'll ring your basket up there.",
  board_title: "Today's tickets",
};

export function mergeOrdersConfig(
  partial: Partial<OrdersConfig> | null | undefined,
): OrdersConfig {
  return { ...DEFAULT_ORDERS_CONFIG, ...(partial ?? {}) };
}

/** `#014` — short enough to shout across a bench, and stable for the record. */
export function formatOrderNumber(orderNumber: number): string {
  return `#${String(orderNumber).padStart(3, "0")}`;
}

export interface SubmitOrderInput {
  lines: CartLine[];
  customerName?: string;
  note?: string;
}

/**
 * Submits the basket as a ticket.
 *
 * The order and its lines go up in ONE nested insert, so they land in a single
 * transaction and an orphan ticket with no items cannot exist. `order_number`,
 * `order_day` and every total are assigned by Postgres triggers — nothing the
 * browser could get wrong or forge is trusted.
 */
export async function submitOrder({
  lines,
  customerName,
  note,
}: SubmitOrderInput): Promise<Order> {
  if (typeof window === "undefined") {
    throw new Error("Orders can only be submitted from the browser.");
  }
  if (lines.length === 0) {
    throw new Error("Your basket is empty.");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      visitor_secret: getVisitorSecret(),
      customer_name: customerName?.trim() || null,
      note: note?.trim() || null,
      order_items: lines.map((line) => ({
        menu_item_id: line.menuItemId,
        name: line.name,
        category: line.category,
        size: line.size,
        modifiers: line.modifiers,
        unit_price: line.unitPrice,
        quantity: line.quantity,
      })),
    })
    .select("*, order_items(*)")
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
}

/**
 * Tickets, newest first. The same query serves the storefront and the admin
 * board — RLS decides the scope: an admin sees today's board, an anonymous
 * browser only ever sees the tickets this device submitted.
 */
export async function fetchOrders(limit = 300): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

/** Admin: move a ticket along. Visitors hold no UPDATE policy on orders. */
export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}
