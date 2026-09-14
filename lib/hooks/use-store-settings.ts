"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import type { OpeningHours, SurchargeNotice } from "@/lib/types/database";

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

import { subscribeToSettingsChanges } from "@/lib/realtime";

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

        if (error || !data) return;

        if (isMounted) {
          data.forEach((row) => {
            if (
              row.key === "opening_hours" &&
              row.value &&
              typeof row.value === "object"
            ) {
              const val = row.value as OpeningHours;
              if (Array.isArray(val.rows) && val.rows.length > 0) {
                // Ensure weekend / holiday row exists if not present in custom row list
                const hasWeekend = val.rows.some((r) =>
                  /saturday|sunday|weekend/i.test(r.label),
                );
                const hasHoliday = val.rows.some((r) =>
                  /holiday/i.test(r.label),
                );

                const mergedRows = [...val.rows];
                if (!hasWeekend) {
                  mergedRows.push({ label: "Saturday & Sunday", value: "Closed" });
                }
                if (!hasHoliday) {
                  mergedRows.push({ label: "Public Holidays", value: "Closed" });
                }

                setOpeningHours({
                  rows: mergedRows,
                  note: val.note || DEFAULT_OPENING_HOURS.note,
                });
              }
            }
            if (
              row.key === "surcharge_notice" &&
              row.value &&
              typeof row.value === "object"
            ) {
              const val = row.value as SurchargeNotice;
              setSurcharge({
                enabled: Boolean(val.enabled),
                text:
                  typeof val.text === "string"
                    ? val.text
                    : DEFAULT_SURCHARGE.text,
              });
            }
          });
        }
      } catch {
        // gracefully retain default values
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();

    // Subscribe to realtime updates for settings (hours & surcharge)
    const unsubscribe = subscribeToSettingsChanges(() => {
      void load();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { openingHours, surcharge, loading };
}

