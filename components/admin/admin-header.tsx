"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  ExternalLink,
  LogOut,
  Palette,
  Settings2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const NAV = [
  { href: "/admin", label: "Items", icon: UtensilsCrossed },
  { href: "/admin/theme", label: "Theme", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Could not sign out", { description: error.message });
      setIsSigningOut(false);
      return;
    }
    router.replace("/admin/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/admin"
          className="flex shrink-0 items-center gap-2"
          aria-label="Foundry admin home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Coffee className="h-4 w-4" />
          </span>
          <div className="hidden sm:flex sm:flex-col sm:leading-tight">
            <span className="font-display text-sm font-semibold">
              Foundry Admin
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Indooroopilly
            </span>
          </div>
        </Link>

        <nav
          className="flex flex-1 items-center gap-1 overflow-x-auto pl-1"
          aria-label="Admin sections"
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "touch-target inline-flex shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "touch-target hidden items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex",
            )}
            title="Open customer storefront in a new tab"
          >
            <span>Live Menu</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            disabled={isSigningOut}
            aria-label="Sign out"
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
