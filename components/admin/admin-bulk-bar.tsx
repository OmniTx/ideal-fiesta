"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Sparkles, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminBulkBarProps {
  selectedCount: number;
  isProcessing: boolean;
  onMarkInStock: () => void;
  onMarkSoldOut: () => void;
  onToggleSpecial: (special: boolean) => void;
  onClearSelection: () => void;
}

export function AdminBulkBar({
  selectedCount,
  isProcessing,
  onMarkInStock,
  onMarkSoldOut,
  onToggleSpecial,
  onClearSelection,
}: AdminBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-xl animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 pl-1">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {selectedCount === 1 ? "item selected" : "items selected"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkInStock}
            disabled={isProcessing}
            className="h-8 gap-1.5 text-xs text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            In Stock
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onMarkSoldOut}
            disabled={isProcessing}
            className="h-8 gap-1.5 text-xs text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
          >
            <XCircle className="h-3.5 w-3.5" />
            Sold Out
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleSpecial(true)}
            disabled={isProcessing}
            className="h-8 gap-1.5 text-xs hidden sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Special
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
