"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Instagram,
  Clock,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  Coffee,
} from "lucide-react";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";
import { findTodayHours } from "@/lib/time";

export function ShopHeader() {
  const { todayHours } = useStoreSettings();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Top Announcement Ribbon */}
      <div className="bg-primary px-4 py-2 text-center text-xs font-semibold tracking-wider text-primary-foreground sm:text-sm">
        <span>100% gluten free kitchen.</span>{" "}
        <span className="font-normal opacity-90">
          Nothing on the premises contains wheat. No cross-contamination.
        </span>
      </div>

      {/* Main Sticky Topbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-85"
            aria-label="Foundry Artisan Coffee Home"
          >
            <Image
              src="/brand/logo.png"
              alt="Foundry Artisan Coffee"
              width={160}
              height={32}
              priority
              className="h-7 w-auto object-contain sm:h-8"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/menu"
              className={`text-sm font-semibold tracking-wider uppercase transition-colors hover:text-foreground ${
                pathname === "/menu"
                  ? "border-b-2 border-foreground pb-0.5 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Menu
            </Link>
            <Link
              href="/specials"
              className={`flex items-center gap-1.5 text-sm font-semibold tracking-wider uppercase transition-colors hover:text-foreground ${
                pathname === "/specials"
                  ? "border-b-2 border-foreground pb-0.5 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Specials
            </Link>
            <Link
              href="/#story"
              className="text-sm font-semibold tracking-wider uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              Story
            </Link>
            <Link
              href="/#visit"
              className="text-sm font-semibold tracking-wider uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              Hours & Location
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="hidden rounded-full bg-foreground px-4 py-2 text-xs font-semibold tracking-wider text-background uppercase transition hover:bg-foreground/85 sm:inline-flex"
            >
              Explore Menu
            </Link>

            <Link
              href="https://www.instagram.com/foundry_artisancoffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted"
              aria-label="Foundry on Instagram"
            >
              <Instagram className="h-4 w-4" />
            </Link>

            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted md:hidden"
              aria-label="Open menu navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          drawerOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <Link href="/" onClick={() => setDrawerOpen(false)}>
              <Image
                src="/brand/logo.png"
                alt="Foundry Artisan Coffee"
                width={140}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="flex flex-col divide-y divide-border">
              <Link
                href="/menu"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-foreground hover:text-primary"
              >
                <span>Full Menu</span>
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/specials"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-foreground hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Foundry Specials
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-primary">
                  Chef picks
                </span>
              </Link>
              <Link
                href="/#story"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-foreground hover:text-primary"
              >
                <span>Our Story</span>
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/#visit"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-foreground hover:text-primary"
              >
                <span>Hours & Location</span>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="https://www.instagram.com/foundry_artisancoffee/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-sm font-semibold tracking-wider uppercase text-foreground hover:text-primary"
              >
                <span>Instagram @foundry_artisancoffee</span>
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="/admin"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-sm font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground"
              >
                <span>Staff & Admin Portal</span>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>

            {/* Hours Callout in Drawer */}
            <div className="mt-8 rounded-2xl border border-border bg-muted/60 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                <Clock className="h-3.5 w-3.5" />
                <span>Today&apos;s Hours</span>
              </div>
              <p className="mt-1 font-display text-lg font-bold text-foreground">
                {todayHours?.value ?? "7:30am – 2:30pm"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Level 3, Indooroopilly Shopping Centre (near Cotton On)
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-border p-6 text-center text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              100% Dedicated Gluten-Free Kitchen
            </p>
            <p className="mt-1">Brisbane, Queensland</p>
          </div>
        </div>
      </div>
    </>
  );
}
