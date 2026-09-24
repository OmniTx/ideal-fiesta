"use client";

import * as React from "react";
import { Download, Gift, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RewardsTable } from "@/components/admin/rewards-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRewards } from "@/lib/hooks/use-rewards";
import { formatPhone } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export default function AdminRewardsPage() {
  const { members, isLoading, error, pendingIds, reload, togglePerk } =
    useRewards();
  const [search, setSearch] = React.useState("");
  const [showRedeemedOnly, setShowRedeemedOnly] = React.useState(false);

  const visible = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      if (showRedeemedOnly && !member.perk_used_at) return false;
      if (!query) return true;
      return (
        member.first_name.toLowerCase().includes(query) ||
        member.phone.includes(query) ||
        member.member_code.toLowerCase().includes(query)
      );
    });
  }, [members, search, showRedeemedOnly]);

  const exportCsv = () => {
    if (visible.length === 0) {
      toast.info("No members to export yet.");
      return;
    }

    const headers = [
      "Member Code",
      "First Name",
      "Phone",
      "Joined",
      "Perk Redeemed At",
      "Source",
    ];

    const rows = visible.map((member) => [
      `"${member.member_code}"`,
      `"${member.first_name.replace(/"/g, '""')}"`,
      `"${formatPhone(member.phone)}"`,
      `"${member.first_seen}"`,
      `"${member.perk_used_at ?? ""}"`,
      `"${(member.source ?? "").replace(/"/g, '""')}"`,
    ]);

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `foundry_rewards_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${visible.length} members to CSV.`);
  };

  return (
    <div className="flex flex-col gap-5 pb-16">
      <AdminPageHeader
        title="Foundry Rewards"
        description={`${members.length} ${members.length === 1 ? "member" : "members"} · ${
          members.filter((member) => !member.perk_used_at).length
        } with the welcome perk still available`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reload()}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, mobile or member code…"
            aria-label="Search rewards members"
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowRedeemedOnly((current) => !current)}
          aria-pressed={showRedeemedOnly}
          className={cn(
            "touch-target inline-flex shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
            showRedeemedOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Gift className="h-4 w-4" />
          Redeemed only
        </button>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!error && isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-20 w-full animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : null}

      {!error && !isLoading && visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">
                {members.length === 0
                  ? "No rewards members yet"
                  : "No members match that search"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {members.length === 0
                  ? "Customers join from the storefront and appear here straight away."
                  : "Try a different name, mobile number or member code."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!error && !isLoading && visible.length > 0 ? (
        <RewardsTable
          members={visible}
          pendingIds={pendingIds}
          onTogglePerk={(member, used) => void togglePerk(member, used)}
        />
      ) : null}
    </div>
  );
}
