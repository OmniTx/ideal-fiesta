import { isMissingFunction } from "@/lib/rpc";
import { getVisitorSecret } from "@/lib/visitor-identity";
import { createClient } from "@/utils/supabase/client";
import type { CartLine } from "@/lib/cart";
import { CUSTOMER_ORDER_STEPS } from "@/lib/types/database";
import type {
  Order,
  OrderItem,
  OrdersConfig,
  OrderStatus,
} from "@/lib/types/database";

export const DEFAULT_ORDERS_CONFIG: OrdersConfig = {
  enabled: true,
  counter_message:
    "Show your order number at the counter and we'll ring your basket up there.",
  board_title: "Today's tickets",
  cancel_window_minutes: 5,
};

export function mergeOrdersConfig(
  partial: Partial<OrdersConfig> | null | undefined,
): OrdersConfig {
  return { ...DEFAULT_ORDERS_CONFIG, ...(partial ?? {}) };
}

/** A ticket still being worked on — the ones that belong on the bench board. */
export function isOrderActive(status: OrderStatus): boolean {
  return status === "new" || status === "preparing";
}

/**
 * What the customer is shown. Both cancellation routes collapse to one word —
 * which of them happened is a staff concern, not the customer's.
 */
export function customerStatusLabel(status: OrderStatus): string {
  if (status === "void" || status === "cancelled") return "Cancelled";
  const step = CUSTOMER_ORDER_STEPS.find((entry) => entry.value === status);
  return step?.label ?? status;
}

/**
 * Whether the customer-facing cancel button should be offered.
 *
 * Advisory only — it runs on the device clock, and the real decision is made by
 * `cancel_own_order` in Postgres, which re-checks both the status and the window.
 */
export function canCancelOrder(
  order: Order,
  cancelWindowMinutes: number,
): boolean {
  if (order.status !== "new") return false;
  const ageMs = Date.now() - new Date(order.created_at).getTime();
  return ageMs <= cancelWindowMinutes * 60 * 1000;
}

/** Customer-initiated cancellation. Resolves to the updated ticket. */
export async function cancelOrder(orderId: string): Promise<Order> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("cancel_own_order", {
    p_order_id: orderId,
    p_secret: getVisitorSecret(),
  });

  if (error) throw new Error(error.message);

  const payload = data as { order?: Order } | null;
  if (!payload?.order) throw new Error("The ticket could not be cancelled.");
  return payload.order;
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

function toItemPayload(lines: CartLine[]) {
  return lines.map((line) => ({
    menu_item_id: line.menuItemId,
    name: line.name,
    category: line.category,
    size: line.size,
    modifiers: line.modifiers,
    unit_price: line.unitPrice,
    quantity: line.quantity,
  }));
}

/**
 * PostgREST answers from an in-memory schema cache and only rebuilds it when the
 * database tells it to. A migration applied without a reload leaves new tables,
 * relationships and functions invisible to the API, which surfaces as a
 * "schema cache" complaint rather than anything useful.
 */
function isSchemaCacheError(error: { message?: string }): boolean {
  return /schema cache/i.test(error.message ?? "");
}

/**
 * Submits the basket as a ticket.
 *
 * The preferred path is the `submit_order` Postgres function: one transaction, so
 * an orphan ticket cannot exist, and the call does not depend on PostgREST
 * resolving the orders -> order_items relationship from its schema cache (which
 * is what broke the old nested insert). `order_number`, `order_day` and every
 * total are still assigned by triggers — nothing the browser sends is trusted.
 *
 * The nested insert is kept as a fallback only when that function is genuinely
 * absent, so a project that hasn't applied 0009 keeps working. Any other failure
 * is surfaced instead of being masked by a second attempt.
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
  const items = toItemPayload(lines);

  const rpc = await supabase.rpc("submit_order", {
    p_items: items,
    p_customer_name: customerName?.trim() || null,
    p_note: note?.trim() || null,
    p_secret: getVisitorSecret(),
  });

  if (!rpc.error) {
    const payload = rpc.data as { order?: Order; items?: OrderItem[] } | null;
    if (!payload?.order) throw new Error("The ticket was not created.");
    return { ...payload.order, order_items: payload.items ?? [] };
  }

  if (!isMissingFunction(rpc.error)) {
    throw new Error(rpc.error.message);
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      visitor_secret: getVisitorSecret(),
      customer_name: customerName?.trim() || null,
      note: note?.trim() || null,
      order_items: items,
    })
    .select("*, order_items(*)")
    .single();

  if (error) {
    // Reaching here with a schema-cache complaint means PostgREST can see
    // neither the relationship nor submit_order — i.e. it has not reloaded since
    // the orders migration. Handing the raw message to a customer reads like a
    // bug in the site, so say what it actually is and what fixes it.
    if (isSchemaCacheError(error)) {
      throw new Error(
        "Ordering is temporarily unavailable — please order at the counter. " +
          "(Operator: the API schema cache is stale. Run " +
          "`notify pgrst, 'reload schema';` in Supabase, then try again.)",
      );
    }
    throw new Error(error.message);
  }
  return data as Order;
}

/**
 * This device's tickets, read by capability token rather than by the SELECT
 * policy.
 *
 * `orders visitor read own` compares against the request header, which the
 * storefront's own requests cannot be relied on to carry — the same reason the
 * write path moved off it in 0011. Reading through `my_orders` also means a
 * customer can see their ticket move, which the policy-based read never allowed.
 */
export async function fetchMyOrders(limit = 20): Promise<Order[]> {
  if (typeof window === "undefined") return [];

  const supabase = createClient();
  const rpc = await supabase.rpc("my_orders", {
    p_secret: getVisitorSecret(),
    p_limit: limit,
  });

  if (!rpc.error) {
    const rows = rpc.data as Order[] | null;
    return Array.isArray(rows) ? rows : [];
  }

  if (!isMissingFunction(rpc.error)) return [];

  // Fallback for a project that has not applied 0013.
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Order[];
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

export interface OrderEditInput {
  customer_name?: string | null;
  note?: string | null;
  status?: OrderStatus;
}

/** Admin: correct a ticket — its name, its note, or its state. */
export async function updateOrder(
  orderId: string,
  fields: OrderEditInput,
): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (fields.customer_name !== undefined) {
    payload.customer_name = fields.customer_name?.trim() || null;
  }
  if (fields.note !== undefined) {
    payload.note = fields.note?.trim() || null;
  }
  if (fields.status !== undefined) {
    payload.status = fields.status;
  }

  if (Object.keys(payload).length === 0) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

/**
 * Admin: remove a ticket outright. Its lines go with it via `on delete cascade`,
 * and the cascade runs outside RLS, so no order_items delete is needed.
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw new Error(error.message);
}

/** Admin: change how many of a line the customer wants. */
export async function updateOrderItemQuantity(
  itemId: string,
  quantity: number,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("order_items")
    .update({ quantity: Math.max(1, Math.min(20, Math.round(quantity))) })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

/** Admin: drop a line from a ticket. The 0008 trigger recounts the totals. */
export async function deleteOrderItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("order_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
}
