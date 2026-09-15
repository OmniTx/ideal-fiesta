"use client";

import * as React from "react";

import { subscribeToSettingsChanges } from "@/lib/realtime";
import { fetchSetting } from "@/lib/settings";
import { DEFAULT_THEME, applyTheme, mergeWithDefaultTheme } from "@/lib/theme";
import type { ThemeSettings } from "@/lib/types/database";

/**
 * Applies the admin-editable brand colours as CSS variables on the document.
 * Mounted once in the root layout so the storefront AND the admin panel follow
 * `system_settings.theme`, and re-applies when an admin saves a new palette.
 *
 * Runs entirely in an effect, so it never touches Supabase during prerender.
 */
export function ThemeLoader() {
  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const saved = await fetchSetting<Partial<ThemeSettings>>("theme");
        if (isActive) applyTheme(mergeWithDefaultTheme(saved));
      } catch {
        if (isActive) applyTheme(DEFAULT_THEME);
      }
    };

    void load();

    const unsubscribe = subscribeToSettingsChanges((key) => {
      if (!key || key === "theme") void load();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return null;
}
