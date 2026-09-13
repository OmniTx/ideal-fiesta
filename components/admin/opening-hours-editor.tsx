"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OpeningHours } from "@/lib/types/database";

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
}

export function OpeningHoursEditor({
  value,
  onChange,
}: OpeningHoursEditorProps) {
  const updateRow = (
    index: number,
    field: "label" | "value",
    next: string,
  ) => {
    onChange({
      ...value,
      rows: value.rows.map((row, i) =>
        i === index ? { ...row, [field]: next } : row,
      ),
    });
  };

  const addRow = () => {
    onChange({
      ...value,
      rows: [...value.rows, { label: "", value: "" }],
    });
  };

  const removeRow = (index: number) => {
    onChange({
      ...value,
      rows: value.rows.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {value.rows.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`hours-label-${index}`} className="text-xs">
                Days
              </Label>
              <Input
                id={`hours-label-${index}`}
                value={row.label}
                onChange={(event) =>
                  updateRow(index, "label", event.target.value)
                }
                placeholder="Monday to Wednesday"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`hours-value-${index}`} className="text-xs">
                Hours
              </Label>
              <Input
                id={`hours-value-${index}`}
                value={row.value}
                onChange={(event) =>
                  updateRow(index, "value", event.target.value)
                }
                placeholder="9am – 5:30pm"
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              aria-label={`Remove hours row ${index + 1}`}
              disabled={value.rows.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        className="w-fit"
      >
        <Plus className="h-4 w-4" />
        Add row
      </Button>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hours-note">Footnote</Label>
        <Textarea
          id="hours-note"
          rows={2}
          value={value.note ?? ""}
          onChange={(event) =>
            onChange({ ...value, note: event.target.value })
          }
          placeholder="Kitchen closes 30 minutes before the centre."
        />
      </div>
    </div>
  );
}
