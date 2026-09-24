import { getVisitorSecret } from "@/lib/visitor-identity";
import { createClient } from "@/utils/supabase/client";
import type { CartLine } from "@/lib/cart";
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

/** PostgREST's "no such function", for a project where 0009 isn't applied yet. */
function isMissingRpc(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST202" ||
    /could not find the function|does not exist/i.test(error.message ?? "")
  );
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
  });

  if (!rpc.error) {
    const payload = rpc.data as { order?: Order; items?: OrderItem[] } | null;
    if (!payload?.order) throw new Error("The ticket was not created.");
    return { ...payload.order, order_items: payload.items ?? [] };
  }

  if (!isMissingRpc(rpc.error)) {
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
