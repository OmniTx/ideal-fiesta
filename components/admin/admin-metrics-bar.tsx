"use client";

import * as React from "react";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminStatusFilter = "all" | "in_stock" | "sold_out" | "specials";

interface AdminMetricsBarProps {
  total: number;
  availableCount: number;
  soldOutCount: number;
  specialsCount: number;
  statusFilter: AdminStatusFilter;
  onStatusFilterChange: (filter: AdminStatusFilter) => void;
}

export function AdminMetricsBar({
  total,
  availableCount,
  soldOutCount,
  specialsCount,
  statusFilter,
  onStatusFilterChange,
}: AdminMetricsBarProps) {
  const toggle = (filter: AdminStatusFilter) => {
    onStatusFilterChange(statusFilter === filter ? "all" : filter);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {/* Total Items */}
      <button
        type="button"
        onClick={() => onStatusFilterChange("all")}
        className={cn(
          "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          statusFilter === "all"
            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
            : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
        )}
      >
        <span className="text-[11px] font-medium text-muted-foreground">
          Total Items
        </span>
        <span className="font-display text-2xl font-bold tabular-nums text-foreground">
          {total}
        </span>
      </button>

      {/* In Stock */}
      <button
        type="button"
        onClick={() => toggle("in_stock")}
        className={cn(
          "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          statusFilter === "in_stock"
            ? "border-emerald-600/40 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-600/30 dark:border-emerald-500/40"
            : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">
            In Stock
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="font-display text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
          {availableCount}
        </span>
      </button>

      {/* Sold Out (86'd) */}
      <button
        type="button"
        onClick={() => toggle("sold_out")}
        className={cn(
          "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          statusFilter === "sold_out"
            ? "border-amber-600/40 bg-amber-500/10 shadow-xs ring-1 ring-amber-600/30 dark:border-amber-500/40"
            : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">
            Sold Out (86&apos;d)
          </span>
          <XCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="font-display text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
          {soldOutCount}
        </span>
      </button>

      {/* Specials */}
      <button
        type="button"
        onClick={() => toggle("specials")}
        className={cn(
          "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          statusFilter === "specials"
            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
            : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">
            Specials
          </span>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="font-display text-2xl font-bold tabular-nums text-foreground">
          {specialsCount}
        </span>
      </button>
    </div>
  );
}
