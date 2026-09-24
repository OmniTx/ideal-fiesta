"use client";

import * as React from "react";
import { toast } from "sonner";

import { ThemeEditor } from "@/components/admin/theme-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchSetting, saveSetting } from "@/lib/settings";
import { subscribeToSettingsChanges } from "@/lib/realtime";
import { DEFAULT_THEME, mergeWithDefaultTheme } from "@/lib/theme";
import type { ThemeSettings } from "@/lib/types/database";

export default function AdminThemePage() {
  const [theme, setTheme] = React.useState<ThemeSettings | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const saved = await fetchSetting<Partial<ThemeSettings>>("theme");
        if (isActive) setTheme(mergeWithDefaultTheme(saved));
      } catch (error) {
        if (!isActive) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load theme.",
        );
        setTheme(DEFAULT_THEME);
      }
    };

    void load();

    // Another admin saving a palette should land here without a reload.
    const unsubscribe = subscribeToSettingsChanges((key) => {
      if (!key || key === "theme") void load();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const save = async (next: ThemeSettings) => {
    try {
      await saveSetting("theme", next);
      toast.success("Theme saved");
      return true;
    } catch (error) {
      toast.error("Could not save theme", {
        description: error instanceof Error ? error.message : undefined,
      });
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div>
        <h1 className="font-display text-2xl font-bold">Theme</h1>
        <p className="text-sm text-muted-foreground">
          Brand colours, applied across the admin and the public menu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colours</CardTitle>
          <CardDescription>
            Artisan Olive is the house default. Changes preview instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {theme ? (
            <ThemeEditor initialTheme={theme} onSave={save} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading theme…</p>
          )}
          {loadError ? (
            <p className="mt-3 text-sm text-destructive">{loadError}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
