"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRICE_PATTERN } from "@/lib/money";
import type { MenuItem } from "@/lib/types/database";

export interface PriceFields {
  price_single: string | null;
  price_small: string | null;
  price_medium: string | null;
  price_large: string | null;
}

interface PriceEditDialogProps {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (item: MenuItem, prices: PriceFields) => Promise<boolean>;
}

const FIELDS = [
  { key: "price_single", label: "Single" },
  { key: "price_small", label: "Small (S)" },
  { key: "price_medium", label: "Medium (M)" },
  { key: "price_large", label: "Large (L)" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function toInputValues(item: MenuItem | null): Record<FieldKey, string> {
  return {
    price_single: item?.price_single != null ? String(item.price_single) : "",
    price_small: item?.price_small != null ? String(item.price_small) : "",
    price_medium: item?.price_medium != null ? String(item.price_medium) : "",
    price_large: item?.price_large != null ? String(item.price_large) : "",
  };
}

export function PriceEditDialog({
  item,
  onOpenChange,
  onSave,
}: PriceEditDialogProps) {
  const [values, setValues] = React.useState<Record<FieldKey, string>>(
    toInputValues(item),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setValues(toInputValues(item));
      setError(null);
    }
  }, [item]);

  const submit = async () => {
    const cleaned = {} as Record<FieldKey, string>;
    for (const field of FIELDS) {
      const raw = values[field.key].trim().replace(/^\$/, "");
      if (raw && !PRICE_PATTERN.test(raw)) {
        setError(`“${raw}” isn’t a valid price. Use up to two decimals.`);
        return;
      }
      cleaned[field.key] = raw;
    }

    if (!FIELDS.some((field) => cleaned[field.key] !== "")) {
      setError("Enter at least one price.");
      return;
    }

    setError(null);
    setIsSaving(true);
    const ok = await onSave(item!, {
      price_single: cleaned.price_single || null,
      price_small: cleaned.price_small || null,
      price_medium: cleaned.price_medium || null,
      price_large: cleaned.price_large || null,
    });
    setIsSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit prices</DialogTitle>
          <DialogDescription>
            {item ? item.name : ""} — leave a size blank if it isn’t offered.
            Prices are AUD and GST inclusive.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`price-${field.key}`}>{field.label}</Label>
              <Input
                id={`price-${field.key}`}
                value={values[field.key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isSaving}>
            Save prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
