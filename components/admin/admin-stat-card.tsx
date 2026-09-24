import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "positive" | "warning" | "accent";
}

const TONE_ICON: Record<NonNullable<AdminStatCardProps["tone"]>, string> = {
  default: "text-muted-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  accent: "text-primary",
};

/**
 * KPI tile for the overview. Renders as a link when it points at a section, so
 * the dashboard doubles as navigation.
 */
export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: AdminStatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", TONE_ICON[tone])} />
      </div>
      <span className="font-display text-2xl font-bold tabular-nums text-foreground">
        {value}
      </span>
      {hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </>
  );

  const className = cn(
    "flex flex-col gap-1 rounded-xl border border-border bg-card p-3.5 text-left shadow-sm transition-all",
    href && "hover:border-foreground/30 hover:bg-muted/40",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
