"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SurchargeNotice } from "@/lib/types/database";

interface SurchargeEditorProps {
  value: SurchargeNotice;
  onChange: (value: SurchargeNotice) => void;
}

export function SurchargeEditor({ value, onChange }: SurchargeEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        Show the surcharge notice on the menu
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ ...value, enabled })}
          aria-label="Show surcharge notice"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="surcharge-text">Notice text</Label>
        <Input
          id="surcharge-text"
          value={value.text}
          onChange={(event) =>
            onChange({ ...value, text: event.target.value })
          }
          placeholder="A 10% surcharge applies on public holidays."
          disabled={!value.enabled}
        />
      </div>
    </div>
  );
}
