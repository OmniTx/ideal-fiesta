"use client";

import Link from "next/link";
import { Coffee, ExternalLink } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";

/** Desktop-only fixed sidebar. The mobile drawer reuses `AdminNav`. */
export function AdminSidebar() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link
        href="/admin"
        className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-opacity hover:opacity-85"
        aria-label="Foundry admin home"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Coffee className="h-4 w-4" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-sm font-semibold">
            Foundry Admin
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Indooroopilly
          </span>
        </span>
      </Link>

      <AdminNav />

      <div className="mt-auto border-t border-border pt-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Open the customer storefront in a new tab"
        >
          <span>Open storefront</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
