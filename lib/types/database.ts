export const MENU_CATEGORY_VALUES = [
  "hot_coffee",
  "iced_coffee",
  "sweet_tooth",
  "hot_drinks",
  "tea",
  "shakes_frappes",
  "breakfast",
  "toasties",
  "specials",
  "spreads",
] as const;

export type MenuCategory = (typeof MENU_CATEGORY_VALUES)[number];

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  hot_coffee: "Hot Coffee",
  iced_coffee: "Iced Coffee",
  sweet_tooth: "Sweet Tooth",
  hot_drinks: "Hot Drinks",
  tea: "Tea",
  shakes_frappes: "Shakes & Frappes",
  breakfast: "Breakfast",
  toasties: "Toasties",
  specials: "Specials",
  spreads: "Spreads",
};

export const MENU_CATEGORIES: { value: MenuCategory; label: string }[] =
  MENU_CATEGORY_VALUES.map((value) => ({
    value,
    label: MENU_CATEGORY_LABELS[value],
  }));

/** Shape returned by PostgREST — numeric columns arrive as numbers. */
export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string | null;
  price_single: number | null;
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  image_url: string | null;
  is_available: boolean;
  is_special: boolean;
  display_order: number;
  created_at: string;
}

/**
 * Write shape. Prices are strings on purpose: the database column is
 * NUMERIC(5,2) and we never round-trip through a float.
 */
export interface MenuItemInsert {
  id?: string;
  name: string;
  category: MenuCategory;
  description?: string | null;
  price_single?: string | null;
  price_small?: string | null;
  price_medium?: string | null;
  price_large?: string | null;
  image_url?: string | null;
  is_available?: boolean;
  is_special?: boolean;
  display_order?: number;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface SystemSettingInsert {
  key: string;
  value: unknown;
}

export interface ThemeSettings {
  background: string;
  foreground: string;
  primary: string;
  card: string;
  border: string;
}

export interface OpeningHours {
  rows: { label: string; value: string }[];
  note?: string;
}

export interface SurchargeNotice {
  enabled: boolean;
  text: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface AnalyticsVisitor {
  visitor_id: string;
  /** Capability token this browser proves via the x-visitor-secret header. */
  visitor_secret?: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  first_seen: string;
  last_seen: string;
  total_visits: number;
  last_ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  device_type: "mobile" | "tablet" | "desktop";
  device_model: string | null;
  os: string | null;
  browser: string | null;
  screen_res: string | null;
  user_agent: string | null;
}

export interface AnalyticsEvent {
  id: string;
  visitor_id: string;
  session_id: string;
  event_type: "pageview" | "item_view" | "category_change" | "lead_captured";
  page_path: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/* Foundry Rewards                                                             */
/* -------------------------------------------------------------------------- */

export interface RewardsMember {
  id: string;
  /** Short, counter-friendly code the member shows to redeem the perk. */
  member_code: string;
  first_name: string;
  phone: string;
  /** Capability token this browser proves via the x-visitor-secret header. */
  visitor_secret?: string | null;
  perk_percent: number;
  perk_used_at: string | null;
  first_seen: string;
  last_seen: string;
  source: string | null;
}

export interface RewardsConfig {
  enabled: boolean;
  headline: string;
  offer: string;
  perk_percent: number;
}

/* -------------------------------------------------------------------------- */
/* Counter order tickets                                                       */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_VALUES = [
  "new",
  "preparing",
  "served",
  "void",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

/** Staff-facing wording. `void` is a staff cancellation, `cancelled` is the customer's. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  served: "Served",
  void: "Void",
  cancelled: "Cancelled by customer",
};

/** The steps a customer is shown, in order. */
export const CUSTOMER_ORDER_STEPS: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Received" },
  { value: "preparing", label: "Being made" },
  { value: "served", label: "Served" },
];

export interface OrderModifier {
  label: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  category: MenuCategory | null;
  size: string | null;
  modifiers: OrderModifier[];
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Order {
  id: string;
  /** Venue-local (Australia/Brisbane) day the ticket belongs to. */
  order_day: string;
  order_number: number;
  /** Capability token this browser proves via the x-visitor-secret header. */
  visitor_secret?: string | null;
  customer_name: string | null;
  status: OrderStatus;
  note: string | null;
  item_count: number;
  subtotal: number;
  created_at: string;
  served_at: string | null;
  /** Present when the row was read with an embedded order_items select. */
  order_items?: OrderItem[];
}

export interface OrdersConfig {
  enabled: boolean;
  counter_message: string;
  board_title: string;
  /** How long a customer may cancel their own ticket, in minutes. */
  cancel_window_minutes: number;
}

/**
 * Hand-authored mirror of the generated Supabase types. The app deliberately
 * does not parameterise its clients with this to keep inference predictable —
 * query results are cast to the interfaces above at the call site.
 */
export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: MenuItem;
        Insert: MenuItemInsert;
        Update: Partial<MenuItemInsert>;
      };
      system_settings: {
        Row: SystemSetting;
        Insert: SystemSettingInsert;
        Update: Partial<SystemSettingInsert>;
      };
      analytics_visitors: {
        Row: AnalyticsVisitor;
        Insert: Partial<AnalyticsVisitor> & { visitor_id: string };
        Update: Partial<AnalyticsVisitor>;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, "id" | "created_at">;
        Update: Partial<AnalyticsEvent>;
      };
      rewards_members: {
        Row: RewardsMember;
        Insert: Partial<RewardsMember> & {
          first_name: string;
          phone: string;
          visitor_secret: string;
        };
        Update: Partial<RewardsMember>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & { visitor_secret: string };
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & {
          order_id: string;
          name: string;
          unit_price: number;
        };
        Update: Partial<OrderItem>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { menu_category: MenuCategory };
    CompositeTypes: Record<string, never>;
  };
}
