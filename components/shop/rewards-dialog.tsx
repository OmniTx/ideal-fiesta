"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { RewardsSignup } from "@/components/shop/rewards-signup";
import { useRewardsSignup } from "@/components/shop/rewards-provider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_REWARDS_CONFIG, mergeRewardsConfig } from "@/lib/rewards";
import { fetchSetting } from "@/lib/settings";
import type { RewardsConfig } from "@/lib/types/database";

/**
 * The one rewards modal, opened from the header button, the hero CTA or the
 * floating ribbon. Copy comes from `system_settings.rewards_config` so the café
 * can reword the offer without a deploy.
 */
export function RewardsDialog() {
  const { isOpen, closeSignup, setMember, member } = useRewardsSignup();
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
        if (isActive) setConfig(DEFAULT_REWARDS_CONFIG);
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : closeSignup())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <Badge className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Foundry Rewards
          </Badge>
          <DialogTitle className="mt-1 font-display text-2xl">
            {member ? `Welcome back, ${member.first_name}` : config.headline}
          </DialogTitle>
          <DialogDescription>{config.offer}</DialogDescription>
        </DialogHeader>

        {member ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Show this member code at the counter for your{" "}
              {Number(member.perk_percent).toFixed(0)}% welcome perk.
            </p>
            <p className="rounded-xl border border-border bg-muted/60 px-5 py-3 font-display text-2xl font-black tracking-tight">
              {member.member_code}
            </p>
            {member.perk_used_at ? (
              <p className="text-xs text-muted-foreground">
                This perk has already been redeemed.
              </p>
            ) : null}
          </div>
        ) : (
          <RewardsSignup source="rewards_dialog" onJoined={setMember} />
        )}
      </DialogContent>
    </Dialog>
  );
}
