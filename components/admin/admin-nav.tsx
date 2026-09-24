"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Gift,
  LayoutDashboard,
  Palette,
  ReceiptText,
  Settings2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match the path exactly — `/admin` would otherwise match every child. */
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/items", label: "Menu items", icon: UtensilsCrossed },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/theme", label: "Appearance", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

interface AdminNavProps {
  onNavigate?: () => void;
  className?: string;
}

/**
 * Dashboard navigation, shared by the desktop sidebar and the mobile drawer so
 * the two can never drift apart.
 */
export function AdminNav({ onNavigate, className }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-col gap-1", className)}
      aria-label="Admin sections"
    >
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "touch-target inline-flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
