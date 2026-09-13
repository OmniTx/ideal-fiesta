import type { ThemeSettings } from "@/lib/types/database";

export const DEFAULT_THEME: ThemeSettings = {
  background: "#FAF6EE",
  foreground: "#1F1E1B",
  primary: "#A35D39",
  card: "#FFFFFF",
  border: "#E8E3D8",
};

export const THEME_TOKENS: {
  key: keyof ThemeSettings;
  label: string;
  hint: string;
}[] = [
  { key: "background", label: "Background", hint: "Page canvas" },
  { key: "foreground", label: "Foreground", hint: "Body text and ink" },
  { key: "primary", label: "Primary / Accent", hint: "Buttons and highlights" },
  { key: "card", label: "Card surface", hint: "Panels and modals" },
  { key: "border", label: "Border", hint: "Hairlines and dividers" },
];

const CSS_VAR_BY_TOKEN: Record<keyof ThemeSettings, string> = {
  background: "--background",
  foreground: "--foreground",
  primary: "--primary",
  card: "--card",
  border: "--border",
};

/** "#FAF6EE" -> "250 246 238" (the channel form Tailwind's rgb() vars expect). */
export function hexToRgbChannels(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

export function themeToCssVars(theme: ThemeSettings): Record<string, string> {
  const vars: Record<string, string> = {};
  (Object.keys(CSS_VAR_BY_TOKEN) as (keyof ThemeSettings)[]).forEach((token) => {
    const channels = hexToRgbChannels(theme[token]);
    if (channels) vars[CSS_VAR_BY_TOKEN[token]] = channels;
  });
  return vars;
}

/** Applies the theme to a DOM node as CSS variables. No build step required. */
export function applyTheme(
  theme: ThemeSettings,
  root: HTMLElement | null = typeof document === "undefined"
    ? null
    : document.documentElement,
): void {
  if (!root) return;
  Object.entries(themeToCssVars(theme)).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

export function isHexColour(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function mergeWithDefaultTheme(
  partial: Partial<ThemeSettings> | null | undefined,
): ThemeSettings {
  return { ...DEFAULT_THEME, ...(partial ?? {}) };
}
