"use client";

import * as React from "react";
import Link from "next/link";
import { Palette, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OpeningHoursEditor } from "@/components/admin/opening-hours-editor";
import { SurchargeEditor } from "@/components/admin/surcharge-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_ORDERS_CONFIG, mergeOrdersConfig } from "@/lib/orders";
import { subscribeToSettingsChanges } from "@/lib/realtime";
import { DEFAULT_REWARDS_CONFIG, mergeRewardsConfig } from "@/lib/rewards";
import { fetchSettings, saveSetting } from "@/lib/settings";
import type {
  OpeningHours,
  OrdersConfig,
  RewardsConfig,
  SurchargeNotice,
} from "@/lib/types/database";

const FALLBACK_HOURS: OpeningHours = {
  rows: [
    { label: "Monday to Friday", value: "7:30am – 2:30pm" },
    { label: "Saturday", value: "8:00am – 3:00pm" },
    { label: "Sunday", value: "9:00am – 2:30pm" },
    { label: "Public Holidays", value: "Closed" },
  ],
  note: "Kitchen closes 30 minutes before the bench.",
};

const FALLBACK_SURCHARGE: SurchargeNotice = {
  enabled: false,
  text: "A 10% surcharge applies on public holidays.",
};

function parseOpeningHours(value: unknown): OpeningHours {
  if (value && typeof value === "object") {
    const candidate = value as OpeningHours;
    if (Array.isArray(candidate.rows)) return candidate;
  }
  return FALLBACK_HOURS;
}

function parseSurcharge(value: unknown): SurchargeNotice {
  if (value && typeof value === "object") {
    const candidate = value as Partial<SurchargeNotice>;
    return {
      enabled: Boolean(candidate.enabled),
      text: typeof candidate.text === "string" ? candidate.text : "",
    };
  }
  return FALLBACK_SURCHARGE;
}

export default function AdminSettingsPage() {
  const [hours, setHours] = React.useState<OpeningHours>(FALLBACK_HOURS);
  const [surcharge, setSurcharge] =
    React.useState<SurchargeNotice>(FALLBACK_SURCHARGE);
  const [ordersConfig, setOrdersConfig] = React.useState<OrdersConfig>(
    DEFAULT_ORDERS_CONFIG,
  );
  const [rewardsConfig, setRewardsConfig] = React.useState<RewardsConfig>(
    DEFAULT_REWARDS_CONFIG,
  );

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  const [isSavingOffers, setIsSavingOffers] = React.useState(false);
  const isSavingRef = React.useRef(false);

  React.useEffect(() => {
    isSavingRef.current = isSavingStore || isSavingOffers;
  }, [isSavingStore, isSavingOffers]);

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const settings = await fetchSettings([
          "opening_hours",
          "surcharge_notice",
          "orders_config",
          "rewards_config",
        ]);
        if (!isActive) return;

        setHours(parseOpeningHours(settings.opening_hours));
        setSurcharge(parseSurcharge(settings.surcharge_notice));
        setOrdersConfig(
          mergeOrdersConfig(settings.orders_config as Partial<OrdersConfig> | null),
        );
        setRewardsConfig(
          mergeRewardsConfig(
            settings.rewards_config as Partial<RewardsConfig> | null,
          ),
        );
      } catch (error) {
        if (!isActive) return;
        toast.error("Could not load settings", {
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();

    const unsubscribe = subscribeToSettingsChanges(() => {
      if (!isSavingRef.current) void load();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const saveStoreSettings = async () => {
    const cleanHours: OpeningHours = {
      rows: hours.rows
        .map((row) => ({
          label: row.label.trim(),
          value: row.value.trim(),
        }))
        .filter((row) => row.label && row.value),
      note: hours.note?.trim() || undefined,
    };

    setIsSavingStore(true);
    try {
      await saveSetting("opening_hours", cleanHours);
      await saveSetting("surcharge_notice", {
        enabled: surcharge.enabled,
        text: surcharge.text.trim(),
      });
      setHours(cleanHours);
      toast.success("Storefront settings saved");
    } catch (error) {
      toast.error("Could not save settings", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSavingStore(false);
    }
  };

  const saveOfferSettings = async () => {
    setIsSavingOffers(true);
    try {
      await saveSetting("orders_config", {
        enabled: ordersConfig.enabled,
        counter_message: ordersConfig.counter_message.trim(),
        board_title: ordersConfig.board_title.trim(),
        cancel_window_minutes: Math.max(
          0,
          Number(ordersConfig.cancel_window_minutes) || 0,
        ),
      });
      await saveSetting("rewards_config", {
        enabled: rewardsConfig.enabled,
        headline: rewardsConfig.headline.trim(),
        offer: rewardsConfig.offer.trim(),
        perk_percent: Number(rewardsConfig.perk_percent) || 0,
      });
      toast.success("Counter and rewards settings saved");
    } catch (error) {
      toast.error("Could not save settings", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSavingOffers(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-16">
      <AdminPageHeader
        title="Settings"
        description="Everything the storefront reads from system_settings."
      />

      <Card>
        <CardHeader>
          <CardTitle>Opening hours</CardTitle>
          <CardDescription>
            Shown in the menu banner, the footer and the Visit section. Times are
            Brisbane local (AEST — Indooroopilly).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <OpeningHoursEditor value={hours} onChange={setHours} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Surcharge notice</CardTitle>
          <CardDescription>
            Weekend, public-holiday and card surcharge messaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SurchargeEditor value={surcharge} onChange={setSurcharge} />
        </CardContent>
      </Card>

      <div>
        <Button onClick={saveStoreSettings} disabled={isSavingStore || isLoading}>
          {isSavingStore ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : null}
          Save storefront settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counter tickets</CardTitle>
          <CardDescription>
            The basket-and-order-number flow customers use on their phones.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            Accept basket submissions
            <Switch
              checked={ordersConfig.enabled}
              onCheckedChange={(enabled) =>
                setOrdersConfig((current) => ({ ...current, enabled }))
              }
              aria-label="Accept basket submissions"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orders-counter-message">Counter message</Label>
            <Textarea
              id="orders-counter-message"
              rows={2}
              value={ordersConfig.counter_message}
              onChange={(event) =>
                setOrdersConfig((current) => ({
                  ...current,
                  counter_message: event.target.value,
                }))
              }
              placeholder="Show your order number at the counter…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orders-board-title">Bench board title</Label>
            <Input
              id="orders-board-title"
              value={ordersConfig.board_title}
              onChange={(event) =>
                setOrdersConfig((current) => ({
                  ...current,
                  board_title: event.target.value,
                }))
              }
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:max-w-[240px]">
            <Label htmlFor="orders-cancel-window">Customer cancel window</Label>
            <Input
              id="orders-cancel-window"
              type="number"
              min={0}
              max={120}
              inputMode="numeric"
              value={ordersConfig.cancel_window_minutes}
              onChange={(event) =>
                setOrdersConfig((current) => ({
                  ...current,
                  cancel_window_minutes: Number(event.target.value),
                }))
              }
            />
            <p className="text-[11px] text-muted-foreground">
              Minutes after submitting that a customer can still cancel. Only
              applies while the ticket is untouched — once staff start it, it
              can no longer be cancelled from the phone. 0 disables it.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foundry Rewards</CardTitle>
          <CardDescription>
            The loyalty offer shown across the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            Show the rewards offer
            <Switch
              checked={rewardsConfig.enabled}
              onCheckedChange={(enabled) =>
                setRewardsConfig((current) => ({ ...current, enabled }))
              }
              aria-label="Show the rewards offer"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rewards-headline">Headline</Label>
            <Input
              id="rewards-headline"
              value={rewardsConfig.headline}
              onChange={(event) =>
                setRewardsConfig((current) => ({
                  ...current,
                  headline: event.target.value,
                }))
              }
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rewards-offer">Offer line</Label>
            <Textarea
              id="rewards-offer"
              rows={2}
              value={rewardsConfig.offer}
              onChange={(event) =>
                setRewardsConfig((current) => ({
                  ...current,
                  offer: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:max-w-[200px]">
            <Label htmlFor="rewards-percent">Perk percentage</Label>
            <Input
              id="rewards-percent"
              type="number"
              min={0}
              max={100}
              inputMode="decimal"
              value={rewardsConfig.perk_percent}
              onChange={(event) =>
                setRewardsConfig((current) => ({
                  ...current,
                  perk_percent: Number(event.target.value),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button onClick={saveOfferSettings} disabled={isSavingOffers || isLoading}>
          {isSavingOffers ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : null}
          Save counter and rewards settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Brand colours are edited on their own screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin/theme"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <Palette className="h-4 w-4" />
            <span>Open theme editor</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
