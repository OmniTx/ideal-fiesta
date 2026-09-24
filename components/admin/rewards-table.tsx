"use client";

import { Gift, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatPhone } from "@/lib/rewards";
import type { RewardsMember } from "@/lib/types/database";

interface RewardsTableProps {
  members: RewardsMember[];
  pendingIds: string[];
  onTogglePerk: (member: RewardsMember, used: boolean) => void;
}

export function RewardsTable({
  members,
  pendingIds,
  onTogglePerk,
}: RewardsTableProps) {
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => {
        const isPending = pendingIds.includes(member.id);
        const perkUsed = Boolean(member.perk_used_at);

        return (
          <li
            key={member.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-bold text-primary">
                {member.member_code.replace("FR-", "")}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {member.first_name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {member.member_code}
                  </span>
                  {perkUsed ? (
                    <Badge variant="muted" className="text-[10px]">
                      Perk redeemed
                    </Badge>
                  ) : (
                    <Badge className="text-[10px]">Perk available</Badge>
                  )}
                </div>
                <a
                  href={`tel:${member.phone}`}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3 w-3" />
                  <span>{formatPhone(member.phone)}</span>
                </a>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[11px] text-muted-foreground">
                Joined{" "}
                {new Date(member.first_seen).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Switch
                  checked={perkUsed}
                  disabled={isPending}
                  onCheckedChange={(next) => onTogglePerk(member, next)}
                  aria-label={`Mark ${member.member_code} perk redeemed`}
                />
                <span>{perkUsed ? "Redeemed" : "Redeem"}</span>
              </label>
              <Gift className="hidden h-4 w-4 text-primary sm:block" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
