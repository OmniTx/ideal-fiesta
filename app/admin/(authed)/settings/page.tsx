"use client";

import * as React from "react";
import { toast } from "sonner";

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
import { fetchSettings, saveSetting } from "@/lib/settings";
import type { OpeningHours, SurchargeNotice } from "@/lib/types/database";

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

import { subscribeToSettingsChanges } from "@/lib/realtime";

export default function AdminSettingsPage() {
  const [hours, setHours] = React.useState<OpeningHours>(FALLBACK_HOURS);
  const [surcharge, setSurcharge] =
    React.useState<SurchargeNotice>(FALLBACK_SURCHARGE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const isSavingRef = React.useRef(false);

  React.useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const settings = await fetchSettings([
          "opening_hours",
          "surcharge_notice",
        ]);
        if (!isActive) return;
        setHours(parseOpeningHours(settings.opening_hours));
        setSurcharge(parseSurcharge(settings.surcharge_notice));
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
      if (!isSavingRef.current) {
        void load();
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const save = async () => {
    const cleanHours: OpeningHours = {
      rows: hours.rows
        .map((row) => ({
          label: row.label.trim(),
          value: row.value.trim(),
        }))
        .filter((row) => row.label && row.value),
      note: hours.note?.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await saveSetting("opening_hours", cleanHours);
      await saveSetting("surcharge_notice", {
        enabled: surcharge.enabled,
        text: surcharge.text.trim(),
      });
      setHours(cleanHours);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Could not save settings", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Opening hours and notices shown on the public menu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opening hours</CardTitle>
          <CardDescription>
            Shown in the menu banner. Times are Brisbane local (AEST - Indooroopilly).
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
        <Button onClick={save} disabled={isSaving || isLoading}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
