import { isMissingFunction } from "@/lib/rpc";
import { getVisitorSecret } from "@/lib/visitor-identity";
import { broadcastRealtimeEvent } from "@/lib/realtime";
import { createClient } from "@/utils/supabase/client";
import type { RewardsConfig, RewardsMember } from "@/lib/types/database";

export const DEFAULT_REWARDS_CONFIG: RewardsConfig = {
  enabled: true,
  headline: "Join Foundry Rewards",
  offer: "Join Foundry Rewards & get 10% off your next visit.",
  perk_percent: 10,
};

export function mergeRewardsConfig(
  partial: Partial<RewardsConfig> | null | undefined,
): RewardsConfig {
  return { ...DEFAULT_REWARDS_CONFIG, ...(partial ?? {}) };
}

/** Strips formatting and folds +61/61 into a local 0-prefixed number. */
export function normalisePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+61")) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith("61") && cleaned.length >= 11) return `0${cleaned.slice(2)}`;
  return cleaned.replace(/^\+/, "");
}

/** `0412345678` -> `0412 345 678`, for display only. */
export function formatPhone(raw: string): string {
  const digits = normalisePhone(raw);
  if (digits.length !== 10) return raw;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export interface JoinRewardsInput {
  firstName: string;
  phone: string;
  source?: string;
}

export type JoinRewardsResult =
  | { status: "joined"; member: RewardsMember }
  | { status: "already_member" };

/**
 * Adds the visitor to Foundry Rewards.
 *
 * Preferred path is `register_rewards_member`, which takes the capability token
 * as a parameter and does the comparison in SQL rather than trusting a request
 * header. A returning customer signing up on a NEW device is told they are
 * already a member rather than being handed an error — the existing row belongs
 * to another token and is deliberately unreachable.
 */
export async function joinRewards({
  firstName,
  phone,
  source,
}: JoinRewardsInput): Promise<JoinRewardsResult> {
  if (typeof window === "undefined") {
    throw new Error("Rewards signup only runs in the browser.");
  }

  const supabase = createClient();

  const rpc = await supabase.rpc("register_rewards_member", {
    p_secret: getVisitorSecret(),
    p_first_name: firstName.trim(),
    p_phone: normalisePhone(phone),
    p_source: source ?? null,
  });

  if (!rpc.error) {
    const payload = rpc.data as
      | { status?: string; member?: RewardsMember }
      | null;

    if (payload?.status === "joined" && payload.member) {
      // An opaque ping so an open dashboard refreshes — no member data crosses
      // the channel, the admin reads the row back through RLS.
      void broadcastRealtimeEvent("lead_captured", {});
      return { status: "joined", member: payload.member };
    }
    return { status: "already_member" };
  }

  if (!isMissingFunction(rpc.error)) {
    throw new Error(rpc.error.message);
  }

  // Fallback for a project that has not applied 0011.
  const { data, error } = await supabase
    .from("rewards_members")
    .upsert(
      {
        first_name: firstName.trim(),
        phone: normalisePhone(phone),
        visitor_secret: getVisitorSecret(),
        last_seen: new Date().toISOString(),
        ...(source ? { source } : {}),
      },
      { onConflict: "phone", ignoreDuplicates: true },
    )
    .select("*");

  if (error) throw new Error(error.message);

  const member = (data ?? [])[0] as RewardsMember | undefined;
  if (!member) return { status: "already_member" };

  void broadcastRealtimeEvent("lead_captured", {});
  return { status: "joined", member };
}

/**
 * This device's membership, if it has one, read by capability token.
 *
 * The SELECT policy on `rewards_members` compares against the request header,
 * which the storefront's own requests cannot be relied on to carry, so this goes
 * through `my_membership` instead.
 */
export async function fetchMyMembership(): Promise<RewardsMember | null> {
  if (typeof window === "undefined") return null;

  const supabase = createClient();
  const rpc = await supabase.rpc("my_membership", {
    p_secret: getVisitorSecret(),
  });

  if (!rpc.error) {
    return (rpc.data as RewardsMember | null) ?? null;
  }

  if (!isMissingFunction(rpc.error)) return null;

  // Fallback for a project that has not applied 0013.
  const { data, error } = await supabase
    .from("rewards_members")
    .select("*")
    .order("first_seen", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as RewardsMember) ?? null;
}

/** Admin: the members list. */
export async function fetchRewardsMembers(limit = 1000): Promise<RewardsMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rewards_members")
    .select("*")
    .order("first_seen", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as RewardsMember[];
}

/** Admin: mark the welcome perk redeemed, or hand it back. */
export async function setPerkUsed(
  memberId: string,
  used: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("rewards_members")
    .update({ perk_used_at: used ? new Date().toISOString() : null })
    .eq("id", memberId);

  if (error) throw new Error(error.message);
}
