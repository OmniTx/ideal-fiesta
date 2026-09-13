"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface OptimisticSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
}

/**
 * A switch that reflects optimistic state. While the write is in flight the
 * control is disabled; if the write fails the parent has already reverted it.
 */
export function OptimisticSwitch({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: OptimisticSwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium text-muted-foreground",
        disabled && "opacity-60",
      )}
    >
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
      <span>{label}</span>
    </label>
  );
}
