"use client";

import * as React from "react";
import { Plus, UtensilsCrossed } from "lucide-react";

import { AdminBulkBar } from "@/components/admin/admin-bulk-bar";
import {
  AdminMetricsBar,
  type AdminStatusFilter,
} from "@/components/admin/admin-metrics-bar";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
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
import type { MenuItemFormValues } from "@/lib/validations/menu";

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
    bulkUpdateAvailability,
    bulkUpdateSpecial,
  } = useMenuItems();

  const [filter, setFilter] = React.useState<CategoryFilterValue>("all");
  const [statusFilter, setStatusFilter] =
    React.useState<AdminStatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const [initialFormValues, setInitialFormValues] =
    React.useState<MenuItemFormValues | null>(null);
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

  const availableCount = React.useMemo(
    () => items.filter((i) => i.is_available).length,
    [items],
  );
  const soldOutCount = React.useMemo(
    () => items.filter((i) => !i.is_available).length,
    [items],
  );
  const specialsCount = React.useMemo(
    () => items.filter((i) => i.is_special).length,
    [items],
  );

  const visibleItems = React.useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (statusFilter === "in_stock" && !item.is_available) return false;
      if (statusFilter === "sold_out" && item.is_available) return false;
      if (statusFilter === "specials" && !item.is_special) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [items, filter, statusFilter, searchQuery]);

  const openCreate = () => {
    setEditingItem(null);
    setInitialFormValues(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setInitialFormValues(null);
    setIsFormOpen(true);
  };

  const handleDuplicate = (item: MenuItem) => {
    setEditingItem(null);
    setInitialFormValues({
      name: `${item.name} (Copy)`,
      category: item.category,
      description: item.description ?? "",
      price_single:
        item.price_single != null ? String(item.price_single) : "",
      price_small: item.price_small != null ? String(item.price_small) : "",
      price_medium:
        item.price_medium != null ? String(item.price_medium) : "",
      price_large: item.price_large != null ? String(item.price_large) : "",
      image_url: item.image_url ?? "",
      is_available: item.is_available,
      is_special: item.is_special,
      display_order: (item.display_order ?? 0) + 1,
    });
    setIsFormOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = visibleItems.map((item) => item.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedIds((current) =>
        Array.from(new Set([...current, ...visibleIds])),
      );
    }
  };

  const handleBulkInStock = async () => {
    setIsBulkProcessing(true);
    await bulkUpdateAvailability(selectedIds, true);
    setIsBulkProcessing(false);
    setSelectedIds([]);
  };

  const handleBulkSoldOut = async () => {
    setIsBulkProcessing(true);
    await bulkUpdateAvailability(selectedIds, false);
    setIsBulkProcessing(false);
    setSelectedIds([]);
  };

  const handleBulkSpecial = async (special: boolean) => {
    setIsBulkProcessing(true);
    await bulkUpdateSpecial(selectedIds, special);
    setIsBulkProcessing(false);
    setSelectedIds([]);
  };

  return (
    <>
      <div className="flex flex-col gap-5 pb-16">
        {/* Top Header & Add Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Menu items
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} · instant
              switches and live search
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreate} className="touch-target gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </div>

        {/* Metrics & Status Strip */}
        <AdminMetricsBar
          total={items.length}
          availableCount={availableCount}
          soldOutCount={soldOutCount}
          specialsCount={specialsCount}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Search Bar & Category Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <AdminSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search items by name or notes… (/)"
              className="w-full sm:max-w-md"
            />
            {statusFilter !== "all" || searchQuery ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Showing {visibleItems.length} of {items.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                    setFilter("all");
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : null}
          </div>

          <CategoryFilter
            active={filter}
            counts={counts}
            total={items.length}
            onChange={setFilter}
          />
        </div>

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
                  {searchQuery || statusFilter !== "all" || filter !== "all"
                    ? "No matching menu items"
                    : "No menu items yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || filter !== "all"
                    ? "Try adjusting your search keyword or clearing the filters."
                    : "Add your first item to get the artisan menu started."}
                </p>
              </div>
              {searchQuery || statusFilter !== "all" || filter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setFilter("all");
                  }}
                >
                  Clear all filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {!error && !isLoading && visibleItems.length > 0 ? (
          <Card className="border-border/80 shadow-xs">
            <CardContent className="px-3 py-1 sm:px-5">
              <ItemsTable
                items={visibleItems}
                pendingIds={pendingIds}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={toggleSelectAll}
                onToggleAvailability={(item, next) =>
                  void toggleAvailability(item, next)
                }
                onToggleSpecial={(item, next) => void toggleSpecial(item, next)}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onEditPrice={setPriceItem}
                onDelete={setDeleteTarget}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <AdminBulkBar
        selectedCount={selectedIds.length}
        isProcessing={isBulkProcessing}
        onMarkInStock={handleBulkInStock}
        onMarkSoldOut={handleBulkSoldOut}
        onToggleSpecial={handleBulkSpecial}
        onClearSelection={() => setSelectedIds([])}
      />

      <ItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        initialValues={initialFormValues}
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
