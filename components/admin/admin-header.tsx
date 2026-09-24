"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coffee, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

/**
 * Admin top bar. On mobile this is the only navigation chrome — it carries the
 * drawer toggle. On desktop the sidebar does the navigating and this reduces to
 * a slim strip with sign-out.
 */
export function AdminHeader() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);

  // Mirror the storefront drawer: lock the page behind the panel.
  React.useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

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
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/admin"
            className="flex items-center gap-2 lg:hidden"
            aria-label="Foundry admin home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Coffee className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-semibold">
              Foundry Admin
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
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

      {/* Mobile navigation drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
          navOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!navOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setNavOpen(false)}
        />

        <div
          className={`absolute top-0 bottom-0 left-0 flex w-full max-w-xs flex-col border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <Coffee className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-semibold">
                Foundry Admin
              </span>
            </span>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted"
              aria-label="Close admin navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <AdminNav onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
}
