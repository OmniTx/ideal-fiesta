"use client";

import * as React from "react";
import { CheckCircle2, Gift, Loader2, Phone, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinRewards } from "@/lib/rewards";
import {
  rewardsSignupSchema,
  type RewardsSignupValues,
} from "@/lib/validations/rewards";
import type { RewardsMember } from "@/lib/types/database";

interface RewardsSignupProps {
  source: string;
  /** Shown under the button; the dialog and the inline section differ slightly. */
  footnote?: string;
  /** Fires once the member row exists, so callers can reflect membership. */
  onJoined?: (member: RewardsMember) => void;
}

type Status = "idle" | "saving" | "joined" | "already_member";

const EMPTY: RewardsSignupValues = { first_name: "", phone: "" };

/**
 * The single Foundry Rewards signup, used in the header dialog, the hero CTA and
 * the homepage section. Two fields only — the client asked for the shortest
 * possible form, so there is no email and no password.
 */
export function RewardsSignup({
  source,
  footnote,
  onJoined,
}: RewardsSignupProps) {
  const [values, setValues] = React.useState<RewardsSignupValues>(EMPTY);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof RewardsSignupValues, string>>
  >({});
  const [status, setStatus] = React.useState<Status>("idle");
  const [member, setMember] = React.useState<RewardsMember | null>(null);

  const update = (field: keyof RewardsSignupValues) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = rewardsSignupSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        first_name: fieldErrors.first_name?.[0],
        phone: fieldErrors.phone?.[0],
      });
      return;
    }

    setErrors({});
    setStatus("saving");

    try {
      const result = await joinRewards({
        firstName: parsed.data.first_name,
        phone: parsed.data.phone,
        source,
      });

      if (result.status === "joined") {
        setMember(result.member);
        setStatus("joined");
        onJoined?.(result.member);
        toast.success("Welcome to Foundry Rewards");
      } else {
        setStatus("already_member");
      }
    } catch (error) {
      setStatus("idle");
      toast.error("Could not join right now", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  if (status === "joined" && member) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-xl font-bold">
            You&apos;re in, {member.first_name}!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Show this member code at the counter for your{" "}
            {Number(member.perk_percent).toFixed(0)}% welcome perk.
          </p>
        </div>
        <p className="rounded-xl border border-border bg-muted/60 px-5 py-3 font-display text-2xl font-black tracking-tight text-foreground">
          {member.member_code}
        </p>
      </div>
    );
  }

  if (status === "already_member") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-primary">
          <Gift className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-lg font-bold">
            You&apos;re already a member
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            That mobile number is on the list. Just give it at the counter and
            we&apos;ll apply your perk.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`rewards-name-${source}`}>First name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`rewards-name-${source}`}
            value={values.first_name}
            onChange={update("first_name")}
            placeholder="Alex"
            autoComplete="given-name"
            className="pl-10"
            aria-invalid={Boolean(errors.first_name)}
          />
        </div>
        {errors.first_name ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.first_name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`rewards-phone-${source}`}>Mobile number</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`rewards-phone-${source}`}
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={update("phone")}
            placeholder="0412 345 678"
            autoComplete="tel"
            className="pl-10"
            aria-invalid={Boolean(errors.phone)}
          />
        </div>
        {errors.phone ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={status === "saving"}
        className="mt-1 w-full"
      >
        {status === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Gift className="h-4 w-4" />
        )}
        Join Foundry Rewards
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        {footnote ??
          "Two fields, that's it. We only use your number for Foundry Rewards — never sold, never spammed."}
      </p>
    </form>
  );
}
