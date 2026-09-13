"use client";

import { cn } from "@/lib/utils";
import { MENU_CATEGORIES, type MenuCategory } from "@/lib/types/database";

export type CategoryFilterValue = MenuCategory | "all";

interface CategoryFilterProps {
  active: CategoryFilterValue;
  counts: Record<string, number>;
  total: number;
  onChange: (value: CategoryFilterValue) => void;
}

export function CategoryFilter({
  active,
  counts,
  total,
  onChange,
}: CategoryFilterProps) {
  const options: { value: CategoryFilterValue; label: string; count: number }[] =
    [
      { value: "all", label: "All", count: total },
      ...MENU_CATEGORIES.map((category) => ({
        value: category.value,
        label: category.label,
        count: counts[category.value] ?? 0,
      })),
    ];

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
      <div
        className="flex items-center gap-2 overflow-x-auto pb-0.5"
        role="tablist"
        aria-label="Filter by category"
      >
        {options.map((option) => {
          const isActive = option.value === active;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                "touch-target inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  isActive ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
