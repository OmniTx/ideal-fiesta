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
  Gift,
  ShoppingBag,
  Phone,
} from "lucide-react";

import { useCart } from "@/components/shop/cart-provider";
import { useRewardsSignup } from "@/components/shop/rewards-provider";
import { GLUTEN_FREE_RIBBON } from "@/lib/copy";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";

export function ShopHeader() {
  const { todayHours } = useStoreSettings();
  const { count, isReady, openCart } = useCart();
  const { member, openSignup } = useRewardsSignup();
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
      {/* Top Announcement Ribbon — normal flow, so it scrolls away with the
          page instead of staying pinned above the topbar. */}
      <div className="bg-primary px-4 py-2 text-center text-xs font-semibold tracking-wider text-primary-foreground sm:text-sm">
        <span>{GLUTEN_FREE_RIBBON}</span>
      </div>

      {/* Main Sticky Topbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-85"
            aria-label="Foundry Artisan Coffee Home"
          >
            <Image
              src="/brand/logo.png"
              alt="Foundry Artisan Coffee"
              width={140}
              height={70}
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
              href="/story"
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
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Rewards — visible from the very top of the page, on every breakpoint */}
            <button
              type="button"
              onClick={openSignup}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 sm:px-4"
            >
              <Gift className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {member ? member.member_code : "Join Rewards · 10% off"}
              </span>
              <span className="sm:hidden">{member ? "Perk" : "Rewards"}</span>
            </button>

            <button
              type="button"
              onClick={openCart}
              className="relative grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted"
              aria-label={
                isReady && count > 0
                  ? `Open basket, ${count} items`
                  : "Open basket"
              }
            >
              <ShoppingBag className="h-5 w-5" />
              {isReady && count > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </button>

            <Link
              href="https://www.instagram.com/foundry_artisancoffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 w-10 place-items-center rounded-full text-foreground transition hover:bg-muted lg:grid"
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
        // Faded out with opacity, so without this the closed drawer's links stay
        // in the tab order and a keyboard user lands on an invisible nav.
        inert={!drawerOpen}
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
            {/* Rewards is the first thing in the drawer */}
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                openSignup();
              }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary p-4 text-left text-primary-foreground transition hover:opacity-90"
            >
              <span>
                <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase opacity-85">
                  <Gift className="h-3.5 w-3.5" />
                  Foundry Rewards
                </span>
                <span className="mt-1 block font-display text-base font-bold">
                  {member
                    ? `You're a member · ${member.member_code}`
                    : "Join & get 10% off your next visit"}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold underline">
                {member ? "View" : "Join"}
              </span>
            </button>

            <div className="mt-6 flex flex-col divide-y divide-border">
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
                href="/story"
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
                href="/contact"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-foreground hover:text-primary"
              >
                <span>Contact & Find Us</span>
                <Phone className="h-4 w-4 text-muted-foreground" />
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
              Dedicated 100% gluten-free kitchen
            </p>
            <p className="mt-1">Brisbane, Queensland</p>
          </div>
        </div>
      </div>
    </>
  );
}
