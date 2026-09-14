"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { ImageUploader } from "@/components/admin/image-uploader";
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
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MENU_CATEGORIES, type MenuItem } from "@/lib/types/database";
import {
  menuItemSchema,
  type MenuItemFormOutput,
  type MenuItemFormValues,
} from "@/lib/validations/menu";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  initialValues?: MenuItemFormValues | null;
  onSave: (
    values: MenuItemFormOutput,
    existing: MenuItem | null,
  ) => Promise<boolean>;
}

function toFormValues(
  item?: MenuItem | null,
  initialValues?: MenuItemFormValues | null,
): MenuItemFormValues {
  if (initialValues) return initialValues;
  return {
    name: item?.name ?? "",
    category: item?.category ?? "hot_coffee",
    description: item?.description ?? "",
    price_single:
      item?.price_single != null ? String(item.price_single) : "",
    price_small: item?.price_small != null ? String(item.price_small) : "",
    price_medium: item?.price_medium != null ? String(item.price_medium) : "",
    price_large: item?.price_large != null ? String(item.price_large) : "",
    image_url: item?.image_url ?? "",
    is_available: item?.is_available ?? true,
    is_special: item?.is_special ?? false,
    display_order: item?.display_order ?? 0,
  };
}

const PRICE_FIELDS = [
  { name: "price_single", label: "Single" },
  { name: "price_small", label: "Small (S)" },
  { name: "price_medium", label: "Medium (M)" },
  { name: "price_large", label: "Large (L)" },
] as const;

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  initialValues,
  onSave,
}: ItemFormDialogProps) {
  const isEditing = Boolean(item);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema) as unknown as Resolver<MenuItemFormValues>,
    defaultValues: toFormValues(item, initialValues),
  });

  React.useEffect(() => {
    if (open) form.reset(toFormValues(item, initialValues));
  }, [open, item, initialValues, form]);

  const submit = form.handleSubmit(async (values) => {
    const ok = await onSave(values, item ?? null);
    if (ok) onOpenChange(false);
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            Prices are AUD, GST inclusive. Leave a size blank if it isn’t
            offered.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              autoComplete="off"
              {...form.register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-category">Category</Label>
            <Select id="item-category" {...form.register("category")}>
              {MENU_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              rows={3}
              placeholder="Tasting notes, ingredients, origin…"
              {...form.register("description")}
            />
            {errors.description ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">Prices</legend>
            <div className="grid grid-cols-2 gap-3">
              {PRICE_FIELDS.map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <Label htmlFor={`item-${field.name}`}>{field.label}</Label>
                  <Input
                    id={`item-${field.name}`}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    {...form.register(field.name)}
                  />
                </div>
              ))}
            </div>
            {errors.price_single ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.price_single.message}
              </p>
            ) : null}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label>Image</Label>
            <Controller
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ? String(field.value) : null}
                  onChange={(url) => field.onChange(url ?? "")}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-display-order">Display order</Label>
            <Input
              id="item-display-order"
              type="number"
              min={0}
              inputMode="numeric"
              {...form.register("display_order", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.display_order)}
            />
            {errors.display_order ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.display_order.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-3">
            <Controller
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 text-sm font-medium">
                  Available (in stock)
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Available in stock"
                  />
                </label>
              )}
            />
            <Controller
              control={form.control}
              name="is_special"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 text-sm font-medium">
                  Feature on the specials page
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Feature on specials"
                  />
                </label>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
