"use client";

import { Pencil, Trash2 } from "lucide-react";

import { OptimisticSwitch } from "@/components/admin/optimistic-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAUD } from "@/lib/money";
import {
  MENU_CATEGORY_LABELS,
  type MenuItem,
} from "@/lib/types/database";

interface ItemsTableProps {
  items: MenuItem[];
  pendingIds: string[];
  onToggleAvailability: (item: MenuItem, next: boolean) => void;
  onToggleSpecial: (item: MenuItem, next: boolean) => void;
  onEdit: (item: MenuItem) => void;
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
  onToggleAvailability,
  onToggleSpecial,
  onEdit,
  onEditPrice,
  onDelete,
}: ItemsTableProps) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const isPending = pendingIds.includes(item.id);
        return (
          <li key={item.id} className="py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
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
                    <span className="truncate font-medium">{item.name}</span>
                    {item.is_special ? <Badge>Special</Badge> : null}
                    {!item.is_available ? (
                      <Badge variant="muted">Sold out</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {MENU_CATEGORY_LABELS[item.category]} · {priceSummary(item)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
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

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPrice(item)}
                    disabled={isPending}
                  >
                    Price
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                    aria-label={`Delete ${item.name}`}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
