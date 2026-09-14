"use client";

import * as React from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";

import { OptimisticSwitch } from "@/components/admin/optimistic-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAUD } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  MENU_CATEGORY_LABELS,
  type MenuItem,
} from "@/lib/types/database";

interface ItemsTableProps {
  items: MenuItem[];
  pendingIds: string[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onToggleAvailability: (item: MenuItem, next: boolean) => void;
  onToggleSpecial: (item: MenuItem, next: boolean) => void;
  onEdit: (item: MenuItem) => void;
  onDuplicate: (item: MenuItem) => void;
  onEditPrice: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}

function priceSummary(item: MenuItem): string {
  const sizes: string[] = [];
  if (item.price_small !== null) sizes.push(`S ${formatAUD(item.price_small)}`);
  if (item.price_medium !== null) {
    sizes.push(`M ${formatAUD(item.price_medium)}`);
  }
  if (item.price_large !== null) sizes.push(`L ${formatAUD(item.price_large)}`);

  if (sizes.length === 0) return formatAUD(item.price_single);
  const sizePart = sizes.join(" · ");
  return item.price_single !== null
    ? `${formatAUD(item.price_single)} · ${sizePart}`
    : sizePart;
}

export function ItemsTable({
  items,
  pendingIds,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onToggleAvailability,
  onToggleSpecial,
  onEdit,
  onDuplicate,
  onEditPrice,
  onDelete,
}: ItemsTableProps) {
  const isAllSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const isSomeSelected =
    items.some((item) => selectedIds.includes(item.id)) && !isAllSelected;

  return (
    <div>
      {/* Table header bar with Select All */}
      {onSelectAll ? (
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5 pt-1 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={onSelectAll}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/20"
              aria-label="Select all visible items"
            />
            <span>Select all visible ({items.length})</span>
          </label>
          <span className="hidden sm:inline text-[11px]">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : "Tip: tap switches to toggle instant availability"}
          </span>
        </div>
      ) : null}

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const isPending = pendingIds.includes(item.id);
          const isSelected = selectedIds.includes(item.id);
          const isSoldOut = !item.is_available;

          return (
            <li
              key={item.id}
              className={cn(
                "py-3.5 transition-colors rounded-lg px-1.5 sm:px-2",
                isSelected && "bg-primary/5",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {onToggleSelect ? (
                    <div className="flex items-center justify-center pr-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer focus:ring-primary/20"
                        aria-label={`Select ${item.name}`}
                      />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted transition-opacity",
                      isSoldOut && "opacity-50 grayscale",
                    )}
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "truncate font-medium",
                          isSoldOut && "text-muted-foreground line-through decoration-muted-foreground/40",
                        )}
                      >
                        {item.name}
                      </span>
                      {item.is_special ? (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0">
                          Special
                        </Badge>
                      ) : null}
                      {isSoldOut ? (
                        <Badge
                          variant="outline"
                          className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0"
                        >
                          Sold out
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {MENU_CATEGORY_LABELS[item.category]}
                      </span>{" "}
                      · <span className="tabular-nums">{priceSummary(item)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:justify-end">
                  <div className="flex items-center gap-4">
                    <OptimisticSwitch
                      id={`available-${item.id}`}
                      label="In stock"
                      checked={item.is_available}
                      disabled={isPending}
                      onCheckedChange={(next) => onToggleAvailability(item, next)}
                    />
                    <OptimisticSwitch
                      id={`special-${item.id}`}
                      label="Special"
                      checked={item.is_special}
                      disabled={isPending}
                      onCheckedChange={(next) => onToggleSpecial(item, next)}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPrice(item)}
                      disabled={isPending}
                      className="h-8 text-xs font-medium px-2.5"
                    >
                      Price
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDuplicate(item)}
                      aria-label={`Duplicate ${item.name}`}
                      title="Duplicate item"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      aria-label={`Edit ${item.name}`}
                      title="Edit details"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      aria-label={`Delete ${item.name}`}
                      title="Delete item"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
