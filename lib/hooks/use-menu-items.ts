"use client";

import * as React from "react";
import { toast } from "sonner";

import { priceOrNull } from "@/lib/money";
import { deleteR2Object, r2KeyFromUrl } from "@/lib/r2";
import { broadcastRealtimeEvent, subscribeToMenuChanges } from "@/lib/realtime";
import { createClient } from "@/utils/supabase/client";
import {
  MENU_CATEGORY_VALUES,
  type MenuItem,
  type MenuItemInsert,
} from "@/lib/types/database";
import type { MenuItemFormOutput } from "@/lib/validations/menu";

const COLUMNS =
  "id,name,category,description,price_single,price_small,price_medium,price_large,image_url,is_available,is_special,display_order,created_at";

export function sortMenuItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const byCategory =
      MENU_CATEGORY_VALUES.indexOf(a.category) -
      MENU_CATEGORY_VALUES.indexOf(b.category);
    if (byCategory !== 0) return byCategory;
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.name.localeCompare(b.name);
  });
}

function toWritePayload(values: MenuItemFormOutput): MenuItemInsert {
  return {
    name: values.name.trim(),
    category: values.category,
    description: values.description?.trim()
      ? values.description.trim()
      : null,
    price_single: priceOrNull(values.price_single),
    price_small: priceOrNull(values.price_small),
    price_medium: priceOrNull(values.price_medium),
    price_large: priceOrNull(values.price_large),
    image_url: values.image_url ? values.image_url : null,
    is_available: values.is_available,
    is_special: values.is_special,
    display_order: values.display_order,
  };
}

async function cleanupImage(url: string | null): Promise<void> {
  const key = r2KeyFromUrl(url);
  if (!key) return;
  try {
    await deleteR2Object(key);
  } catch {
    // Non-fatal: the row is already saved. Orphaned objects are harmless.
  }
}

const CACHE_KEY = "foundry_menu_items_cache";

function getCachedItems(): MenuItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCachedItems(items: MenuItem[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(items));
  } catch {
    // Non-fatal
  }
}

export function useMenuItems() {
  const supabase = React.useMemo(() => createClient(), []);
  const [items, setItems] = React.useState<MenuItem[]>(() => getCachedItems());
  const [isLoading, setIsLoading] = React.useState(
    () => getCachedItems().length === 0,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);
  const pendingIdsRef = React.useRef<string[]>([]);

  const itemsRef = React.useRef<MenuItem[]>([]);
  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  React.useEffect(() => {
    pendingIdsRef.current = pendingIds;
  }, [pendingIds]);

  const load = React.useCallback(async () => {
    if (itemsRef.current.length === 0) setIsLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("menu_items")
      .select(COLUMNS)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (queryError) {
      setError(queryError.message);
    } else {
      const sorted = sortMenuItems((data ?? []) as MenuItem[]);
      setItems(sorted);
      setCachedItems(sorted);
    }
    setIsLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    void load();

    // Subscribe to live updates from other devices/tabs
    const unsubscribe = subscribeToMenuChanges(() => {
      if (pendingIdsRef.current.length === 0) {
        void load();
      }
    });

    return () => unsubscribe();
  }, [load]);

  const markPending = (id: string, pending: boolean) => {
    setPendingIds((current) =>
      pending ? [...current, id] : current.filter((value) => value !== id),
    );
  };

  /** Applies an optimistic patch, then persists. Reverts on failure. */
  const patch = React.useCallback(
    async (
      id: string,
      optimistic: Partial<MenuItem>,
      write: Partial<MenuItemInsert>,
      successMessage: string,
    ): Promise<boolean> => {
      const snapshot = itemsRef.current;
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...optimistic } : item,
        ),
      );
      markPending(id, true);

      const { error: writeError } = await supabase
        .from("menu_items")
        .update(write)
        .eq("id", id);

      markPending(id, false);

      if (writeError) {
        setItems(snapshot);
        toast.error("Change reverted", { description: writeError.message });
        return false;
      }

      toast.success(successMessage);
      void broadcastRealtimeEvent("menu_updated");
      return true;
    },
    [supabase],
  );

  const toggleAvailability = React.useCallback(
    (item: MenuItem, next: boolean) =>
      patch(
        item.id,
        { is_available: next },
        { is_available: next },
        next ? `${item.name} is back in stock` : `${item.name} marked sold out`,
      ),
    [patch],
  );

  const toggleSpecial = React.useCallback(
    (item: MenuItem, next: boolean) =>
      patch(
        item.id,
        { is_special: next },
        { is_special: next },
        next ? `${item.name} added to specials` : `${item.name} removed from specials`,
      ),
    [patch],
  );

  const updatePrices = React.useCallback(
    async (
      item: MenuItem,
      prices: {
        price_single: string | null;
        price_small: string | null;
        price_medium: string | null;
        price_large: string | null;
      },
    ): Promise<boolean> => {
      const optimistic: Partial<MenuItem> = {
        price_single: prices.price_single === null ? null : Number(prices.price_single),
        price_small: prices.price_small === null ? null : Number(prices.price_small),
        price_medium: prices.price_medium === null ? null : Number(prices.price_medium),
        price_large: prices.price_large === null ? null : Number(prices.price_large),
      };

      const success = await patch(
        item.id,
        optimistic,
        prices,
        `Prices updated for ${item.name}`,
      );
      return success;
    },
    [patch],
  );

  const saveItem = React.useCallback(
    async (
      values: MenuItemFormOutput,
      existing?: MenuItem | null,
    ): Promise<boolean> => {
      const payload = toWritePayload(values);

      if (existing) {
        const { data, error: writeError } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", existing.id)
          .select(COLUMNS)
          .single();

        if (writeError) {
          toast.error("Could not save item", { description: writeError.message });
          return false;
        }

        const saved = data as MenuItem;
        setItems((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        );

        const oldKey = r2KeyFromUrl(existing.image_url);
        const newKey = r2KeyFromUrl(saved.image_url);
        if (oldKey && oldKey !== newKey) {
          await cleanupImage(existing.image_url);
        }

        toast.success(`${saved.name} updated`);
        void broadcastRealtimeEvent("menu_updated");
        return true;
      }

      const { data, error: writeError } = await supabase
        .from("menu_items")
        .insert(payload)
        .select(COLUMNS)
        .single();

      if (writeError) {
        toast.error("Could not add item", { description: writeError.message });
        return false;
      }

      const saved = data as MenuItem;
      setItems((current) => sortMenuItems([...current, saved]));
      toast.success(`${saved.name} added to the menu`);
      void broadcastRealtimeEvent("menu_updated");
      return true;
    },
    [supabase],
  );

  const deleteItem = React.useCallback(
    async (item: MenuItem): Promise<boolean> => {
      const snapshot = itemsRef.current;
      setItems((current) => current.filter((row) => row.id !== item.id));

      const { error: deleteError } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        setItems(snapshot);
        toast.error("Could not delete item", {
          description: deleteError.message,
        });
        return false;
      }

      await cleanupImage(item.image_url);
      toast.success(`${item.name} deleted`);
      void broadcastRealtimeEvent("menu_updated");
      return true;
    },
    [supabase],
  );

  const bulkUpdateAvailability = React.useCallback(
    async (ids: string[], next: boolean): Promise<boolean> => {
      if (ids.length === 0) return true;
      const snapshot = itemsRef.current;
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id) ? { ...item, is_available: next } : item,
        ),
      );
      setPendingIds((current) => [...current, ...ids]);

      const { error: writeError } = await supabase
        .from("menu_items")
        .update({ is_available: next })
        .in("id", ids);

      setPendingIds((current) => current.filter((id) => !ids.includes(id)));

      if (writeError) {
        setItems(snapshot);
        toast.error("Bulk update failed", { description: writeError.message });
        return false;
      }

      toast.success(
        next
          ? `${ids.length} ${ids.length === 1 ? "item" : "items"} marked in stock`
          : `${ids.length} ${ids.length === 1 ? "item" : "items"} marked sold out`,
      );
      void broadcastRealtimeEvent("menu_updated");
      return true;
    },
    [supabase],
  );

  const bulkUpdateSpecial = React.useCallback(
    async (ids: string[], next: boolean): Promise<boolean> => {
      if (ids.length === 0) return true;
      const snapshot = itemsRef.current;
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id) ? { ...item, is_special: next } : item,
        ),
      );
      setPendingIds((current) => [...current, ...ids]);

      const { error: writeError } = await supabase
        .from("menu_items")
        .update({ is_special: next })
        .in("id", ids);

      setPendingIds((current) => current.filter((id) => !ids.includes(id)));

      if (writeError) {
        setItems(snapshot);
        toast.error("Bulk update failed", { description: writeError.message });
        return false;
      }

      toast.success(
        next
          ? `${ids.length} ${ids.length === 1 ? "item" : "items"} added to specials`
          : `${ids.length} ${ids.length === 1 ? "item" : "items"} removed from specials`,
      );
      void broadcastRealtimeEvent("menu_updated");
      return true;
    },
    [supabase],
  );

  return {
    items,
    isLoading,
    error,
    pendingIds,
    reload: load,
    toggleAvailability,
    toggleSpecial,
    updatePrices,
    saveItem,
    deleteItem,
    bulkUpdateAvailability,
    bulkUpdateSpecial,
  };
}
