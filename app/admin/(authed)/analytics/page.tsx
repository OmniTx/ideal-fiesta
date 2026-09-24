"use client";

import * as React from "react";
import {
  Users,
  Smartphone,
  Phone,
  Download,
  Search,
  RefreshCw,
  Coffee,
  Laptop,
  Tablet,
  Activity,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { subscribeToAnalytics, subscribeToTableChanges } from "@/lib/realtime";
import { isVisitorLive } from "@/lib/presence";
import { fetchRewardsMembers, formatPhone } from "@/lib/rewards";
import type {
  AnalyticsVisitor,
  AnalyticsEvent,
  RewardsMember,
} from "@/lib/types/database";

/** A rewards member enriched with the telemetry row for the same device. */
interface LeadRow {
  member: RewardsMember;
  visitor: AnalyticsVisitor | null;
  visits: number;
}

export default function AdminAnalyticsPage() {
  const [visitors, setVisitors] = React.useState<AnalyticsVisitor[]>([]);
  const [events, setEvents] = React.useState<AnalyticsEvent[]>([]);
  const [members, setMembers] = React.useState<RewardsMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"visitors" | "leads" | "items">("visitors");

  const supabase = React.useMemo(() => createClient(), []);
  const reloadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch telemetry from the analytics tables. Anonymous visitors write directly
  // via RLS, so data lands even when no admin is online.
  const loadData = React.useCallback(async () => {
    try {
      const [visitorsRes, eventsRes, memberRows] = await Promise.all([
        supabase
          .from("analytics_visitors")
          .select("*")
          .order("last_seen", { ascending: false })
          .limit(500),
        supabase
          .from("analytics_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300),
        // Customer contact details live in rewards_members now —
        // analytics_visitors is telemetry only and never holds a name or phone.
        fetchRewardsMembers().catch(() => [] as RewardsMember[]),
      ]);

      setVisitors((visitorsRes.data ?? []) as AnalyticsVisitor[]);
      setEvents((eventsRes.data ?? []) as AnalyticsEvent[]);
      setMembers(memberRows);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    void loadData();

    const scheduleReload = () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => void loadData(), 1500);
    };

    // Signals from the private admin topic are opaque pings, never customer
    // data: read the rows back through RLS and coalesce bursts into one query.
    const unsubscribeSignals = subscribeToAnalytics(({ event }) => {
      if (event === "lead_captured") {
        toast.info("New Foundry Rewards member", { duration: 4000 });
      }
      scheduleReload();
    });

    // The dashboard's own tables, live. Heartbeats and leave markers land here,
    // so "on the storefront now" moves on its own rather than only when a
    // visitor happens to load another page.
    const unsubscribeTables = subscribeToTableChanges(
      ["analytics_visitors", "analytics_events", "rewards_members"],
      scheduleReload,
    );

    // Safety net if the socket drops.
    const poll = setInterval(() => void loadData(), 60_000);

    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      clearInterval(poll);
      unsubscribeSignals();
      unsubscribeTables();
    };
  }, [loadData]);

  // Derived metrics
  const now = Date.now();
  const activeNow = visitors.filter((visitor) =>
    isVisitorLive(visitor, now),
  ).length;

  // Visits per visitor, counted from pageview events (durable rows).
  const visitsByVisitor: Record<string, number> = {};
  events.forEach((ev) => {
    if (ev.event_type === "pageview") {
      visitsByVisitor[ev.visitor_id] = (visitsByVisitor[ev.visitor_id] ?? 0) + 1;
    }
  });

  // Members and their device telemetry share a capability token, so a member can
  // be matched back to the device row that produced their visit history.
  const visitorBySecret = React.useMemo(() => {
    const map = new Map<string, AnalyticsVisitor>();
    visitors.forEach((visitor) => {
      if (visitor.visitor_secret) map.set(visitor.visitor_secret, visitor);
    });
    return map;
  }, [visitors]);

  const leads = React.useMemo<LeadRow[]>(
    () =>
      members.map((member) => {
        const visitor = member.visitor_secret
          ? visitorBySecret.get(member.visitor_secret) ?? null
          : null;
        return {
          member,
          visitor,
          visits:
            (visitor ? visitsByVisitor[visitor.visitor_id] : undefined) ??
            visitor?.total_visits ??
            1,
        };
      }),
    [members, visitorBySecret, visitsByVisitor],
  );

  const perksUnused = members.filter((member) => !member.perk_used_at).length;

  const mobileCount = visitors.filter(
    (v) => v.device_type === "mobile" || v.device_type === "tablet",
  ).length;
  const mobileShare =
    visitors.length > 0
      ? Math.round((mobileCount / visitors.length) * 100)
      : 0;

  // Most viewed menu items
  const itemViewsCount: Record<string, { count: number; category: string }> = {};
  events.forEach((ev) => {
    if (ev.event_type === "item_view" && ev.metadata?.itemName) {
      const name = String(ev.metadata.itemName);
      const cat = String(ev.metadata.category || "");
      if (!itemViewsCount[name]) {
        itemViewsCount[name] = { count: 0, category: cat };
      }
      itemViewsCount[name].count += 1;
    }
  });

  const popularItems = Object.entries(itemViewsCount)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  // Filtered members
  const filteredLeads = leads.filter(({ member, visitor }) => {
    const q = searchQuery.toLowerCase();
    return (
      member.first_name.toLowerCase().includes(q) ||
      member.phone.includes(q) ||
      member.member_code.toLowerCase().includes(q) ||
      (visitor?.city?.toLowerCase().includes(q) ?? false) ||
      (visitor?.last_ip?.includes(q) ?? false)
    );
  });

  // Filtered visitors
  const filteredVisitors = visitors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      (v.last_ip && v.last_ip.includes(q)) ||
      (v.device_model && v.device_model.toLowerCase().includes(q)) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.os && v.os.toLowerCase().includes(q)) ||
      (v.browser && v.browser.toLowerCase().includes(q))
    );
  });

  // Export CSV
  const exportCsv = () => {
    if (filteredLeads.length === 0) {
      toast.info("No rewards members to export yet.");
      return;
    }

    const headers = [
      "Member Code",
      "First Name",
      "Mobile",
      "Joined",
      "Perk Redeemed At",
      "Visits",
      "Device Model",
      "Device Type",
      "IP Address",
      "City",
      "Country",
    ];

    const rows = filteredLeads.map(({ member, visitor, visits }) => [
      `"${member.member_code}"`,
      `"${member.first_name.replace(/"/g, '""')}"`,
      `"${formatPhone(member.phone)}"`,
      `"${member.first_seen}"`,
      `"${member.perk_used_at ?? ""}"`,
      visits,
      `"${(visitor?.device_model || "").replace(/"/g, '""')}"`,
      `"${visitor?.device_type || ""}"`,
      `"${visitor?.last_ip || ""}"`,
      `"${visitor?.city || ""}"`,
      `"${visitor?.country || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `foundry_rewards_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredLeads.length} members to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Live Analytics & Rewards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time visitor telemetry, device intelligence, and Foundry Rewards
            members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadData();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Live Active Visitors */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">On The Storefront Now</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {activeNow}
            </span>
            <span className="text-xs text-muted-foreground">visible now</span>
          </div>
        </div>

        {/* Card 2: Rewards Members */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rewards Members</span>
            <Gift className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-primary">
              {members.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {perksUnused} perk unused
            </span>
          </div>
        </div>

        {/* Card 3: Total Tracked Visitors */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Unique Visitors</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {visitors.length}
            </span>
            <span className="text-xs text-muted-foreground">devices logged</span>
          </div>
        </div>

        {/* Card 4: Mobile Share */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Mobile Traffic</span>
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {mobileShare}%
            </span>
            <span className="text-xs text-muted-foreground">
              {mobileCount} phones & tablets
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "leads"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            <span>Rewards Members ({leads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("visitors")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "visitors"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Recent Visitors ({visitors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "items"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Coffee className="h-3.5 w-3.5" />
            <span>Popular Items ({popularItems.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members, name, IP…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </div>
      </div>

      {/* TAB CONTENT 1: REWARDS MEMBERS */}
      {activeTab === "leads" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Gift className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-semibold">No rewards members yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When customers join Foundry Rewards on the storefront, their
                first name, mobile, member code and perk status appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">IP & Location</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Perk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeads.map(({ member, visitor, visits }) => (
                    <tr key={member.id} className="transition hover:bg-muted/30">
                      {/* Member name + code */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {member.first_name}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {member.member_code}
                        </div>
                      </td>

                      {/* Mobile with quick action */}
                      <td className="px-4 py-3.5">
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{formatPhone(member.phone)}</span>
                        </a>
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          {visitor?.device_type === "mobile" ? (
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : visitor?.device_type === "tablet" ? (
                            <Tablet className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span>{visitor?.device_model || "Unknown device"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {visitor
                            ? `${visitor.os ?? "—"} · ${visitor.browser ?? "—"}`
                            : "No telemetry matched"}
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-foreground">
                          {visitor?.last_ip || "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {[visitor?.city, visitor?.region, visitor?.country]
                            .filter(Boolean)
                            .join(", ") || "Location unavailable"}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {new Date(member.first_seen).toLocaleDateString("en-AU", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Perk state */}
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            member.perk_used_at
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {member.perk_used_at ? "Redeemed" : "Available"}
                        </span>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {visits} {visits === 1 ? "visit" : "visits"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: RECENT VISITORS */}
      {activeTab === "visitors" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredVisitors.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="mx-auto h-8 w-8 opacity-50" />
              <p className="mt-2 text-sm font-semibold">No visitor records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Device & Phone Model</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">OS & Browser</th>
                    <th className="px-4 py-3">Screen</th>
                    <th className="px-4 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVisitors.map((v) => (
                    <tr key={v.visitor_id} className="transition hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          {v.device_type === "mobile" ? (
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-foreground">
                            {v.device_model || "Standard Device"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {v.last_ip || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {v.city ? v.city : v.country ? v.country : "Unknown Location"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {[v.region, v.country].filter(Boolean).join(", ") ||
                            (v.city ? "" : "Location unavailable")}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {v.os || "—"} · {v.browser || "—"}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {v.screen_res || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isVisitorLive(v, now) ? "bg-emerald-500" : "bg-border"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="text-muted-foreground">
                            {new Date(v.last_seen).toLocaleTimeString("en-AU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: POPULAR MENU ITEMS */}
      {activeTab === "items" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-display text-base font-semibold">
              Most Tapped Menu Items
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Items visitors interacted with and customized most frequently.
            </p>

            {popularItems.length === 0 ? (
              <div className="mt-8 py-8 text-center text-xs text-muted-foreground">
                <Coffee className="mx-auto h-6 w-6 opacity-50" />
                <p className="mt-2">No menu item taps recorded yet.</p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {popularItems.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 place-items-center rounded bg-muted font-mono text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        {item.count} views
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-display text-base font-semibold">
              Realtime Interaction Stream
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest clickstream events captured across the storefront.
            </p>

            <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto">
              {events.slice(0, 15).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary">
                        {ev.event_type.replace("_", " ")}
                      </span>
                      <span className="font-medium text-foreground">
                        {ev.page_path}
                      </span>
                    </div>
                    {Boolean(ev.metadata?.itemName) && (
                      <p className="text-[11px] text-muted-foreground">
                        Item: <strong>{String(ev.metadata.itemName)}</strong>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(ev.created_at).toLocaleTimeString("en-AU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No interaction events recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
