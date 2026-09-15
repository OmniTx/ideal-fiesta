"use client";

import * as React from "react";
import {
  Users,
  Smartphone,
  Phone,
  Mail,
  Download,
  Search,
  RefreshCw,
  Coffee,
  Laptop,
  Tablet,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { subscribeToAnalytics } from "@/lib/realtime";
import type { AnalyticsVisitor, AnalyticsEvent } from "@/lib/types/database";

export default function AdminAnalyticsPage() {
  const [visitors, setVisitors] = React.useState<AnalyticsVisitor[]>([]);
  const [events, setEvents] = React.useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"visitors" | "leads" | "items">("visitors");

  const supabase = React.useMemo(() => createClient(), []);

  // Fetch telemetry from the dedicated analytics tables. Anonymous visitors
  // write directly via RLS, so data lands even when no admin is online.
  const loadData = React.useCallback(async () => {
    try {
      const [visitorsRes, eventsRes] = await Promise.all([
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
      ]);

      setVisitors((visitorsRes.data ?? []) as AnalyticsVisitor[]);
      setEvents((eventsRes.data ?? []) as AnalyticsEvent[]);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    void loadData();

    // Subscribe to live realtime analytics and lead events on REALTIME_CHANNEL
    const unsubscribe = subscribeToAnalytics((msg: unknown) => {
      const envelope = msg as { payload?: Record<string, unknown> } | undefined;
      const payload = envelope?.payload;

      if (payload?.visitor) {
        const incoming = payload.visitor as AnalyticsVisitor;

        setVisitors((prev) => {
          const existsIndex = prev.findIndex((v) => v.visitor_id === incoming.visitor_id);
          let nextList: AnalyticsVisitor[];
          if (existsIndex >= 0) {
            nextList = [...prev];
            nextList[existsIndex] = {
              ...nextList[existsIndex],
              ...incoming,
              last_seen: incoming.last_seen || new Date().toISOString(),
            };
          } else {
            nextList = [
              {
                ...incoming,
                first_seen: incoming.first_seen ?? new Date().toISOString(),
                total_visits: incoming.total_visits ?? 1,
              } as AnalyticsVisitor,
              ...prev,
            ];
          }
          nextList.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
          return nextList;
        });

        if (payload.pagePath) {
          const newEvent: AnalyticsEvent = {
            id: `live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            visitor_id: incoming.visitor_id,
            session_id: "s_live",
            ip: incoming.last_ip,
            event_type: "pageview",
            page_path: payload.pagePath as string,
            created_at: new Date().toISOString(),
            metadata: {
              deviceModel: (payload.deviceModel as string) || incoming.device_model,
              ip: (payload.ip as string) || incoming.last_ip,
              city: (payload.city as string) || incoming.city,
              country: (payload.country as string) || incoming.country,
            },
          };
          setEvents((prev) => [newEvent, ...prev.slice(0, 199)]);
        }

        const loc = [incoming.city, incoming.country].filter(Boolean).join(", ");
        toast.info(
          `📱 Live visit: ${incoming.device_model || "Mobile"} ${loc ? `(${loc})` : ""} on ${payload.pagePath || "/"}`,
          { duration: 4500 },
        );
      } else {
        void loadData();
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  // Derived metrics
  const now = Date.now();
  const fifteenMinAgo = now - 15 * 60 * 1000;
  const activeNow = visitors.filter(
    (v) => new Date(v.last_seen).getTime() > fifteenMinAgo,
  ).length;

  // Visits per visitor, counted from pageview events (durable rows).
  const visitsByVisitor: Record<string, number> = {};
  events.forEach((ev) => {
    if (ev.event_type === "pageview") {
      visitsByVisitor[ev.visitor_id] = (visitsByVisitor[ev.visitor_id] ?? 0) + 1;
    }
  });

  const identifiedLeads = visitors.filter(
    (v) => Boolean(v.name || v.phone || v.email),
  );

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

  // Filtered leads
  const filteredLeads = identifiedLeads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    return (
      (lead.name && lead.name.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.device_model && lead.device_model.toLowerCase().includes(q)) ||
      (lead.last_ip && lead.last_ip.includes(q))
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
    if (identifiedLeads.length === 0) {
      toast.info("No identified leads to export yet.");
      return;
    }

    const headers = [
      "Name",
      "Phone",
      "Email",
      "First Seen",
      "Last Seen",
      "Total Visits",
      "Device Model",
      "Device Type",
      "IP Address",
      "City",
      "Country",
    ];

    const rows = identifiedLeads.map((l) => [
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${l.first_seen}"`,
      `"${l.last_seen}"`,
      visitsByVisitor[l.visitor_id] ?? l.total_visits ?? 1,
      `"${(l.device_model || "").replace(/"/g, '""')}"`,
      `"${l.device_type}"`,
      `"${l.last_ip || ""}"`,
      `"${l.city || ""}"`,
      `"${l.country || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `foundry_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${identifiedLeads.length} leads to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Live Analytics & Leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time visitor telemetry, device intelligence, and captured customer contacts.
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
            disabled={identifiedLeads.length === 0}
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
            <span className="text-xs font-medium">Live Active (15m)</span>
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
            <span className="text-xs text-muted-foreground">online now</span>
          </div>
        </div>

        {/* Card 2: Captured Customer Leads */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Identified Leads</span>
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-primary">
              {identifiedLeads.length}
            </span>
            <span className="text-xs text-muted-foreground">with Name/Phone/Email</span>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
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
            <Phone className="h-3.5 w-3.5" />
            <span>Identified Leads ({identifiedLeads.length})</span>
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
            placeholder="Search leads, IP, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* TAB CONTENT 1: IDENTIFIED LEADS */}
      {activeTab === "leads" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Phone className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-semibold">No identified leads yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When customers submit the regulars form or VIP club on the menu, their name, phone, email, and phone device info will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone & Email</th>
                    <th className="px-4 py-3">Device / Phone</th>
                    <th className="px-4 py-3">IP & Location</th>
                    <th className="px-4 py-3">Last Seen</th>
                    <th className="px-4 py-3 text-right">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.visitor_id} className="transition hover:bg-muted/30">
                      {/* Customer Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {lead.name || "Anonymous Customer"}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          ID: {lead.visitor_id.slice(0, 16)}...
                        </div>
                      </td>

                      {/* Phone & Email with Quick Actions */}
                      <td className="px-4 py-3.5 space-y-1">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {lead.email && (
                          <div>
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <Mail className="h-3 w-3" />
                              <span>{lead.email}</span>
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Device / Phone Model */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          {lead.device_type === "mobile" ? (
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : lead.device_type === "tablet" ? (
                            <Tablet className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span>{lead.device_model || "Mobile Device"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {lead.os} · {lead.browser}
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-foreground">
                          {lead.last_ip || "Unknown IP"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {[lead.city, lead.region, lead.country].filter(Boolean).join(", ") || "Location unavailable"}
                        </div>
                      </td>

                      {/* Last Seen */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {new Date(lead.last_seen).toLocaleDateString("en-AU", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Total Visits */}
                      <td className="px-4 py-3.5 text-right font-semibold">
                        {visitsByVisitor[lead.visitor_id] ?? lead.total_visits ?? 1}
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
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase">
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
                        {v.name && (
                          <span className="mt-0.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {v.name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {v.last_ip || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-foreground font-medium">
                          {v.city ? v.city : v.country ? v.country : "Unknown Location"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {[v.region, v.country].filter(Boolean).join(", ") || (v.city ? "" : "Location unavailable")}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {v.os || "—"} · {v.browser || "—"}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {v.screen_res || "—"}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(v.last_seen).toLocaleTimeString("en-AU", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
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
                  <div key={item.name} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 place-items-center rounded bg-muted font-mono font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{item.count} views</span>
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

            <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto">
              {events.slice(0, 15).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase">
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
