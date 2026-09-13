"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_THEME,
  THEME_TOKENS,
  applyTheme,
  isHexColour,
} from "@/lib/theme";
import type { ThemeSettings } from "@/lib/types/database";

interface ThemeEditorProps {
  initialTheme: ThemeSettings;
  onSave: (theme: ThemeSettings) => Promise<boolean>;
}

export function ThemeEditor({ initialTheme, onSave }: ThemeEditorProps) {
  const [theme, setTheme] = React.useState<ThemeSettings>(initialTheme);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  const update = (key: keyof ThemeSettings, value: string) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
    if (isHexColour(value)) applyTheme(next);
  };

  const save = async () => {
    const invalid = THEME_TOKENS.find((token) => !isHexColour(theme[token.key]));
    if (invalid) {
      toast.error("Check the colour values", {
        description: `“${theme[invalid.key]}” isn’t a valid hex colour.`,
      });
      return;
    }

    setIsSaving(true);
    const ok = await onSave(theme);
    setIsSaving(false);
    if (ok) applyTheme(theme);
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_TOKENS.map((token) => (
          <div
            key={token.key}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <input
              type="color"
              value={isHexColour(theme[token.key]) ? theme[token.key] : "#000000"}
              onChange={(event) => update(token.key, event.target.value)}
              aria-label={`${token.label} colour picker`}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label htmlFor={`theme-${token.key}`} className="text-xs">
                {token.label}
                <span className="ml-1 font-normal text-muted-foreground">
                  · {token.hint}
                </span>
              </Label>
              <Input
                id={`theme-${token.key}`}
                value={theme[token.key]}
                onChange={(event) => update(token.key, event.target.value)}
                spellCheck={false}
                autoComplete="off"
                className="h-9 font-mono text-xs uppercase"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={isSaving}>
          Save theme
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          disabled={isSaving}
        >
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Changes preview instantly. Saving writes to{" "}
        <code className="font-mono">system_settings.theme</code>, which the
        storefront reads too.
      </p>
    </div>
  );
}
