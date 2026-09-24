"use client";

import * as React from "react";

import { fetchMyMembership } from "@/lib/rewards";
import type { RewardsMember } from "@/lib/types/database";

interface RewardsContextValue {
  /** This device's membership, if it has joined already. */
  member: RewardsMember | null;
  isMember: boolean;
  isOpen: boolean;
  openSignup: () => void;
  closeSignup: () => void;
  setMember: (member: RewardsMember) => void;
}

const RewardsContext = React.createContext<RewardsContextValue | null>(null);

/**
 * Holds the Foundry Rewards membership for this device so the header button, the
 * hero CTA and the homepage section all share one state. The dialog itself is
 * rendered separately (see `rewards-dialog.tsx`) so this module has no cycle.
 */
export function RewardsProvider({ children }: { children: React.ReactNode }) {
  const [member, setMemberState] = React.useState<RewardsMember | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  // RLS scopes this read to the row carrying this browser's capability token,
  // so it returns either this device's membership or nothing.
  React.useEffect(() => {
    let isActive = true;
    void (async () => {
      const found = await fetchMyMembership();
      if (isActive && found) setMemberState(found);
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const value = React.useMemo<RewardsContextValue>(
    () => ({
      member,
      isMember: Boolean(member),
      isOpen,
      openSignup: () => setIsOpen(true),
      closeSignup: () => setIsOpen(false),
      setMember: setMemberState,
    }),
    [member, isOpen],
  );

  return (
    <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>
  );
}

export function useRewardsSignup(): RewardsContextValue {
  const context = React.useContext(RewardsContext);
  if (!context) {
    throw new Error("useRewardsSignup must be used inside RewardsProvider");
  }
  return context;
}
