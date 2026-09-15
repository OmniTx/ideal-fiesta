"use client";

import * as React from "react";

import { subscribeToSettingsChanges } from "@/lib/realtime";
import { findTodayHours } from "@/lib/time";
import type { OpeningHours, SurchargeNotice } from "@/lib/types/database";
import { createClient } from "@/utils/supabase/client";

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  rows: [
    { label: "Monday to Friday", value: "7:30am – 2:30pm" },
    { label: "Saturday", value: "8:00am – 3:00pm" },
    { label: "Sunday", value: "9:00am – 2:30pm" },
    { label: "Public Holidays", value: "Closed" },
  ],
  note: "Kitchen closes 30 minutes before the bench.",
};

export const DEFAULT_SURCHARGE: SurchargeNotice = {
  enabled: false,
  text: "A 10% surcharge applies on public holidays.",
};

/**
 * Live store settings (opening hours + surcharge). Reads straight from
 * system_settings and refreshes on the realtime `settings_updated` broadcast,
 * so an admin edit lands on open storefront tabs without a reload.
 */
export function useStoreSettings() {
  const [openingHours, setOpeningHours] =
    React.useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  const [surcharge, setSurcharge] =
    React.useState<SurchargeNotice>(DEFAULT_SURCHARGE);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function load() {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("key, value")
          .in("key", ["opening_hours", "surcharge_notice"]);

        if (error || !data || !isMounted) return;

        data.forEach((row) => {
          if (
            row.key === "opening_hours" &&
            row.value &&
            typeof row.value === "object"
          ) {
            const value = row.value as OpeningHours;
            if (Array.isArray(value.rows) && value.rows.length > 0) {
              setOpeningHours({
                rows: value.rows,
                note: value.note || DEFAULT_OPENING_HOURS.note,
              });
            }
          }

          if (
            row.key === "surcharge_notice" &&
            row.value &&
            typeof row.value === "object"
          ) {
            const value = row.value as SurchargeNotice;
            setSurcharge({
              enabled: Boolean(value.enabled),
              text:
                typeof value.text === "string"
                  ? value.text
                  : DEFAULT_SURCHARGE.text,
            });
          }
        });
      } catch {
        // Keep the defaults.
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();

    const unsubscribe = subscribeToSettingsChanges(() => {
      void load();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    openingHours,
    surcharge,
    todayHours: findTodayHours(openingHours.rows),
    loading,
  };
}
