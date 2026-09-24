"use client";

import * as React from "react";
import { CheckCircle2, Gift, Sparkles, X } from "lucide-react";

import { RewardsSignup } from "@/components/shop/rewards-signup";
import { useRewardsSignup } from "@/components/shop/rewards-provider";
import { useMyOrders } from "@/components/shop/order-provider";
import { useCart } from "@/components/shop/cart-provider";
import { DEFAULT_REWARDS_CONFIG, mergeRewardsConfig } from "@/lib/rewards";
import { fetchSetting } from "@/lib/settings";
import type { RewardsConfig } from "@/lib/types/database";

/**
 * The floating Foundry Rewards nudge.
 *
 * Dismissal is recorded in `sessionStorage`, not `localStorage`: the old version
 * hid the offer permanently, so anyone who closed it once never saw it again —
 * the opposite of what a signup push wants. It also disappears for good once the
 * device is a member.
 */
const PERK_DISMISSED_KEY = "foundry_rewards_dismissed";

export function VipPerkBanner() {
  const { isMember, openSignup } = useRewardsSignup();
  const { activeOrder } = useMyOrders();
  const { count } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(true);
  const [submitted, setSubmitted] = React.useState(false);
  const [config, setConfig] = React.useState<RewardsConfig>(
    DEFAULT_REWARDS_CONFIG,
  );

  React.useEffect(() => {
    let isActive = true;
    void (async () => {
      try {
        const saved = await fetchSetting<Partial<RewardsConfig>>("rewards_config");
        if (isActive) setConfig(mergeRewardsConfig(saved));
      } catch {
        // Keep the defaults.
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(PERK_DISMISSED_KEY)) return;
      // Show after a moment of browsing, so it doesn't fight the hero CTA.
      const timer = setTimeout(() => setIsDismissed(false), 4000);
      return () => clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(PERK_DISMISSED_KEY, "true");
    } catch {
      // Non-fatal.
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    openSignup();
    setIsOpen(false);
    setSubmitted(true);
  };

  // Everything that wants the bottom of the screen queues up here: a ticket in
  // flight outranks a signup nudge, and a filled basket outranks it too — the
  // basket bar takes the slot so this never covers it.
  if (isDismissed || isMember || !config.enabled || activeOrder || count > 0) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Ribbon */}
      {!isOpen && !submitted && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md animate-slide-up">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-foreground p-3.5 text-background shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Gift className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold">{config.headline}</p>
                <p className="text-[11px] text-background/85">{config.offer}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-full bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-card"
              >
                Join
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-background/55 hover:text-background"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop and Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-background p-6 text-foreground shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="space-y-3 py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">
                  You&apos;re on the list!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Show your member code at the Level 3 counter for your welcome
                  perk.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 w-full rounded-full bg-foreground py-2.5 text-xs font-semibold text-background"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Foundry Rewards</span>
                </div>

                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
                  {config.headline}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {config.offer}
                </p>

                <div className="mt-5">
                  <RewardsSignup
                    source="vip_perk_banner"
                    footnote="Two fields and you're in. We only use your number for Foundry Rewards."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
