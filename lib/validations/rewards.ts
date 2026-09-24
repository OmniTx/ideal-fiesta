import { z } from "zod";

import { normalisePhone } from "@/lib/rewards";

/**
 * The signup is deliberately two fields. The client asked for the shortest
 * possible form, so there is no email and no password — the mobile number is
 * the identifier and the device already holds the capability token.
 */
export const rewardsSignupSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "What should we call you?")
    .max(60, "That name is a little long"),
  phone: z
    .string()
    .trim()
    .min(1, "We need a mobile number")
    .refine(
      (value) => /^0\d{9}$/.test(normalisePhone(value)),
      "Use a 10-digit Australian number, like 0412 345 678",
    ),
});

export type RewardsSignupValues = z.input<typeof rewardsSignupSchema>;
export type RewardsSignupOutput = z.output<typeof rewardsSignupSchema>;
