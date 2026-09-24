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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { menu_category: MenuCategory };
    CompositeTypes: Record<string, never>;
  };
}
