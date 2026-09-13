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

export function ShopHeader() {
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
      <div className="bg-[#46543a] px-4 py-2 text-center text-xs font-semibold tracking-wider text-[#f0efe2] sm:text-sm">
        <span>100% gluten free kitchen.</span>{" "}
        <span className="font-normal opacity-90">
          Nothing on the premises contains wheat. No cross-contamination.
        </span>
      </div>

      {/* Main Sticky Topbar */}
      <header className="sticky top-0 z-40 border-b border-[#dbd5c0] bg-[#f3f0e1]/95 backdrop-blur-sm">
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
              className={`text-sm font-semibold tracking-wider uppercase transition-colors hover:text-[#1b1915] ${
                pathname === "/menu"
                  ? "border-b-2 border-[#1b1915] pb-0.5 text-[#1b1915]"
                  : "text-[#6e6a5a]"
              }`}
            >
              Menu
            </Link>
            <Link
              href="/specials"
              className={`flex items-center gap-1.5 text-sm font-semibold tracking-wider uppercase transition-colors hover:text-[#1b1915] ${
                pathname === "/specials"
                  ? "border-b-2 border-[#1b1915] pb-0.5 text-[#1b1915]"
                  : "text-[#6e6a5a]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#5a6b4b]" />
              Specials
            </Link>
            <Link
              href="/#story"
              className="text-sm font-semibold tracking-wider uppercase text-[#6e6a5a] transition-colors hover:text-[#1b1915]"
            >
              Story
            </Link>
            <Link
              href="/#visit"
              className="text-sm font-semibold tracking-wider uppercase text-[#6e6a5a] transition-colors hover:text-[#1b1915]"
            >
              Hours & Location
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="hidden rounded-full bg-[#1b1915] px-4 py-2 text-xs font-semibold tracking-wider text-[#f3f0e1] uppercase transition hover:bg-[#3b2a1e] sm:inline-flex"
            >
              Explore Menu
            </Link>

            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full text-[#1b1915] transition hover:bg-[#eae5d2]"
              aria-label="Foundry on Instagram"
            >
              <Instagram className="h-4 w-4" />
            </Link>

            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-[#1b1915] transition hover:bg-[#eae5d2] md:hidden"
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
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 flex w-full max-w-sm flex-col border-l border-[#dbd5c0] bg-[#f3f0e1] shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#dbd5c0] px-6 py-4">
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
              className="grid h-10 w-10 place-items-center rounded-full text-[#1b1915] transition hover:bg-[#eae5d2]"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="flex flex-col divide-y divide-[#dbd5c0]">
              <Link
                href="/menu"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-[#1b1915] hover:text-[#5a6b4b]"
              >
                <span>Full Menu</span>
                <Coffee className="h-4 w-4 text-[#6e6a5a]" />
              </Link>
              <Link
                href="/specials"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-[#1b1915] hover:text-[#5a6b4b]"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#5a6b4b]" />
                  Foundry Specials
                </span>
                <span className="rounded-full bg-[#eae5d2] px-2 py-0.5 text-xs text-[#46543a]">
                  Chef picks
                </span>
              </Link>
              <Link
                href="/#story"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-[#1b1915] hover:text-[#5a6b4b]"
              >
                <span>Our Story</span>
                <UtensilsCrossed className="h-4 w-4 text-[#6e6a5a]" />
              </Link>
              <Link
                href="/#visit"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-base font-semibold tracking-wider uppercase text-[#1b1915] hover:text-[#5a6b4b]"
              >
                <span>Hours & Location</span>
                <MapPin className="h-4 w-4 text-[#6e6a5a]" />
              </Link>
              <Link
                href="/admin"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between py-4 text-sm font-semibold tracking-wider uppercase text-[#6e6a5a] hover:text-[#1b1915]"
              >
                <span>Staff & Admin Portal</span>
                <ShieldCheck className="h-4 w-4 text-[#6e6a5a]" />
              </Link>
            </div>

            {/* Hours Callout in Drawer */}
            <div className="mt-8 rounded-2xl border border-[#dbd5c0] bg-[#eae5d2]/60 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#46543a] uppercase">
                <Clock className="h-3.5 w-3.5" />
                <span>Today&apos;s Hours</span>
              </div>
              <p className="mt-1 font-display text-lg font-bold text-[#1b1915]">
                Open from 6:30am
              </p>
              <p className="mt-1 text-xs text-[#6e6a5a]">
                Level 3, Indooroopilly Shopping Centre (near Event Cinemas)
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-[#dbd5c0] p-6 text-center text-xs text-[#6e6a5a]">
            <p className="font-medium text-[#1b1915]">
              100% Dedicated Gluten-Free Kitchen
            </p>
            <p className="mt-1">Brisbane, Queensland</p>
          </div>
        </div>
      </div>
    </>
  );
}
