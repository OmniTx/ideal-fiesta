"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Gift,
  ReceiptText,
  Settings2,
  Users,
  XCircle,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMenuItems } from "@/lib/hooks/use-menu-items";
import { useOrders } from "@/lib/hooks/use-orders";
import { useRewards } from "@/lib/hooks/use-rewards";
import { formatAUD } from "@/lib/money";
import { formatOrderNumber } from "@/lib/orders";
import { liveSinceIso } from "@/lib/presence";
import { subscribeToTableChanges } from "@/lib/realtime";
import { formatVenueTime, venueDateString } from "@/lib/time";
import { createClient } from "@/utils/supabase/client";

export default function AdminOverviewPage() {
  const { orders } = useOrders();
  const { items } = useMenuItems();
  const { members } = useRewards();

  const supabase = React.useMemo(() => createClient(), []);
  const [liveVisitors, setLiveVisitors] = React.useState<number | null>(null);
  const [dateLabel, setDateLabel] = React.useState("");
  const liveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const countLive = React.useCallback(async () => {
    const since = liveSinceIso();

    // Seen recently AND not reported gone since. `left_at` is what makes this
    // drop the moment someone closes the tab, rather than at the end of a
    // timeout window.
    const { count } = await supabase
      .from("analytics_visitors")
      .select("visitor_id", { count: "exact", head: true })
      .gte("last_seen", since)
      .or(`left_at.is.null,left_at.lte.${since}`);

    setLiveVisitors(count ?? 0);
  }, [supabase]);

  // Both of these depend on "now", which differs between the prerender and the
  // browser — so they are only filled in after mount to avoid a mismatch.
  React.useEffect(() => {
    setDateLabel(
      formatVenueTime(new Date(), {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  React.useEffect(() => {
    void countLive();

    // Arriving, heartbeating and leaving are all row writes, so this keeps the
    // count honest without anyone pressing refresh.
    const unsubscribe = subscribeToTableChanges(["analytics_visitors"], () => {
      if (liveTimer.current) clearTimeout(liveTimer.current);
      liveTimer.current = setTimeout(() => void countLive(), 1500);
    });

    // Safety net if the socket drops.
    const poll = setInterval(() => void countLive(), 60_000);

    return () => {
      if (liveTimer.current) clearTimeout(liveTimer.current);
      clearInterval(poll);
      unsubscribe();
    };
  }, [countLive]);

  const today = venueDateString();
  const todayOrders = orders.filter(
    (order) => order.order_day === today && order.status !== "void",
  );
  const openOrders = todayOrders.filter((order) => order.status === "new");
  const todayTakings = todayOrders.reduce(
    (total, order) => total + Number(order.subtotal ?? 0),
    0,
  );
  const soldOut = items.filter((item) => !item.is_available);
  const perksUnused = members.filter((member) => !member.perk_used_at);

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Overview"
        description={dateLabel || "Today"}
        actions={
          <Link
            href="/admin/orders/board"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/85"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Open bench board</span>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard
          label="Open tickets"
          value={openOrders.length}
          hint={`${todayOrders.length} today · ${formatAUD(todayTakings)}`}
          icon={ReceiptText}
          href="/admin/orders"
          tone="accent"
        />
        <AdminStatCard
          label="On the storefront now"
          value={liveVisitors ?? "—"}
          hint="Live customers browsing"
          icon={Users}
          href="/admin/analytics"
        />
        <AdminStatCard
          label="Rewards members"
          value={members.length}
          hint={`${perksUnused.length} perk unused`}
          icon={Gift}
          href="/admin/rewards"
          tone="positive"
        />
        <AdminStatCard
          label="Sold out"
          value={soldOut.length}
          hint={`of ${items.length} items`}
          icon={XCircle}
          href="/admin/items"
          tone={soldOut.length > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Latest tickets</CardTitle>
            <CardDescription>
              Baskets submitted from the storefront.
            </CardDescription>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tickets yet. When a customer submits a basket, it appears here
              and on the bench board.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 5).map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="font-display text-lg font-bold tabular-nums">
                      {formatOrderNumber(order.order_number)}
                    </span>
                    <Badge
                      variant={order.status === "new" ? "default" : "muted"}
                      className="text-[10px]"
                    >
                      {order.status === "new" ? "New" : "Served"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {order.item_count} {order.item_count === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatAUD(order.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/admin/items",
            label: "Menu items",
            hint: "Prices, stock and specials",
            icon: Coffee,
          },
          {
            href: "/admin/rewards",
            label: "Foundry Rewards",
            hint: "Members and perk redemption",
            icon: Gift,
          },
          {
            href: "/admin/settings",
            label: "Settings",
            hint: "Hours, surcharge, counter and rewards",
            icon: Settings2,
          },
        ].map(({ href, label, hint, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-foreground/30 hover:bg-muted/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
