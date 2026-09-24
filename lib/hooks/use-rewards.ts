"use client";

import * as React from "react";
import { toast } from "sonner";

import { fetchRewardsMembers, setPerkUsed } from "@/lib/rewards";
import { subscribeToTableChanges } from "@/lib/realtime";
import type { RewardsMember } from "@/lib/types/database";

/**
 * Foundry Rewards members for the admin. Same optimistic-with-rollback shape as
 * `use-menu-items` and `use-orders`, so a perk toggle flips instantly and
 * reverts if the write is rejected.
 */
export function useRewards({ live = true }: { live?: boolean } = {}) {
  const [members, setMembers] = React.useState<RewardsMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);

  const membersRef = React.useRef<RewardsMember[]>([]);
  const reloadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const load = React.useCallback(async () => {
    try {
      const rows = await fetchRewardsMembers();
      setMembers(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load members");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    if (!live) return;

    const unsubscribe = subscribeToTableChanges(["rewards_members"], () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => void load(), 800);
    });

    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      unsubscribe();
    };
  }, [load, live]);

  // Same safety net as the order board: a member joining should appear without
  // anyone pressing refresh, even if the socket is down.
  React.useEffect(() => {
    if (!live) return;
    const poll = setInterval(() => void load(), 60_000);
    return () => clearInterval(poll);
  }, [load, live]);

  const togglePerk = React.useCallback(
    async (member: RewardsMember, used: boolean): Promise<boolean> => {
      const snapshot = membersRef.current;
      setMembers((current) =>
        current.map((row) =>
          row.id === member.id
            ? { ...row, perk_used_at: used ? new Date().toISOString() : null }
            : row,
        ),
      );
      setPendingIds((current) => [...current, member.id]);

      try {
        await setPerkUsed(member.id, used);
        toast.success(
          used
            ? `${member.member_code} perk marked redeemed`
            : `${member.member_code} perk handed back`,
        );
        return true;
      } catch (err) {
        setMembers(snapshot);
        toast.error("Could not update the perk", {
          description: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setPendingIds((current) => current.filter((id) => id !== member.id));
      }
    },
    [],
  );

  return { members, isLoading, error, pendingIds, reload: load, togglePerk };
}
