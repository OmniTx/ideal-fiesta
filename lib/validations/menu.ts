import { z } from "zod";

import { MENU_CATEGORY_VALUES } from "@/lib/types/database";

const HEX = /^#[0-9a-fA-F]{6}$/;

const optionalPrice = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\d{1,3}(\.\d{1,2})?$/, "Use a price like 6.00"),
  ])
  .optional();

export const menuItemSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    category: z.enum(MENU_CATEGORY_VALUES),
    description: z.string().trim().max(400).optional(),
    price_single: optionalPrice,
    price_small: optionalPrice,
    price_medium: optionalPrice,
    price_large: optionalPrice,
    image_url: z
      .union([z.literal(""), z.string().url("Enter a valid image URL")])
      .nullable()
      .optional(),
    is_available: z.boolean(),
    is_special: z.boolean(),
    display_order: z
      .number({ invalid_type_error: "Enter a display order" })
      .int()
      .min(0)
      .max(9999),
  })
  .refine(
    (values) =>
      [
        values.price_single,
        values.price_small,
        values.price_medium,
        values.price_large,
      ].some((price) => Boolean(price && price.length)),
    { message: "Enter at least one price", path: ["price_single"] },
  );

export type MenuItemFormValues = z.input<typeof menuItemSchema>;
export type MenuItemFormOutput = z.output<typeof menuItemSchema>;

export const themeSettingsSchema = z.object({
  background: z.string().regex(HEX, "Use a hex colour like #A35D39"),
  foreground: z.string().regex(HEX, "Use a hex colour like #1F1E1B"),
  primary: z.string().regex(HEX, "Use a hex colour like #A35D39"),
  card: z.string().regex(HEX, "Use a hex colour like #FFFFFF"),
  border: z.string().regex(HEX, "Use a hex colour like #E8E3D8"),
});

export type ThemeSettingsFormValues = z.infer<typeof themeSettingsSchema>;

export const openingHoursSchema = z.object({
  rows: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Add a label"),
        value: z.string().trim().min(1, "Add hours"),
      }),
    )
    .max(14),
  note: z.string().trim().max(200).optional(),
});

export type OpeningHoursFormValues = z.infer<typeof openingHoursSchema>;

export const surchargeNoticeSchema = z.object({
  enabled: z.boolean(),
  text: z.string().trim().max(200).optional().default(""),
});

export type SurchargeNoticeFormValues = z.infer<typeof surchargeNoticeSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Passwords are at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
