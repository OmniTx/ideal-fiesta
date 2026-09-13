"use client";

import * as React from "react";
import { Plus, UtensilsCrossed } from "lucide-react";

import {
  CategoryFilter,
  type CategoryFilterValue,
} from "@/components/admin/category-filter";
import { DeleteItemDialog } from "@/components/admin/delete-item-dialog";
import { useMenuItems } from "@/lib/hooks/use-menu-items";
import { ItemFormDialog } from "@/components/admin/item-form-dialog";
import { ItemsTable } from "@/components/admin/items-table";
import { PriceEditDialog } from "@/components/admin/price-edit-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MenuItem } from "@/lib/types/database";

export default function AdminItemsPage() {
  const {
    items,
    isLoading,
    error,
    pendingIds,
    reload,
    toggleAvailability,
    toggleSpecial,
    updatePrices,
    saveItem,
    deleteItem,
  } = useMenuItems();

  const [filter, setFilter] = React.useState<CategoryFilterValue>("all");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const [priceItem, setPriceItem] = React.useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MenuItem | null>(null);

  const counts = React.useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  const visibleItems = React.useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((item) => item.category === filter),
    [items, filter],
  );

  const openCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <h1 className="font-display text-2xl font-bold">Menu items</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} · toggles
              save instantly
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>

        <CategoryFilter
          active={filter}
          counts={counts}
          total={items.length}
          onChange={setFilter}
        />

        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!error && isLoading ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-16 w-full animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : null}

        {!error && !isLoading && visibleItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">
                  {items.length === 0
                    ? "No menu items yet"
                    : "Nothing in this category"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length === 0
                    ? "Add your first item to get the menu started."
                    : "Try another filter, or add something here."}
                </p>
              </div>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!error && !isLoading && visibleItems.length > 0 ? (
          <Card>
            <CardContent className="px-4 py-1 sm:px-5">
              <ItemsTable
                items={visibleItems}
                pendingIds={pendingIds}
                onToggleAvailability={(item, next) =>
                  void toggleAvailability(item, next)
                }
                onToggleSpecial={(item, next) => void toggleSpecial(item, next)}
                onEdit={openEdit}
                onEditPrice={setPriceItem}
                onDelete={setDeleteTarget}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSave={saveItem}
      />

      <PriceEditDialog
        item={priceItem}
        onOpenChange={(open) => {
          if (!open) setPriceItem(null);
        }}
        onSave={updatePrices}
      />

      <DeleteItemDialog
        item={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={deleteItem}
      />
    </>
  );
}
