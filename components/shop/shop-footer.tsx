"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, MapPin, Clock, ShieldCheck, Heart } from "lucide-react";
import { GLUTEN_FREE_FOOTER } from "@/lib/copy";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";

export function ShopFooter() {
  const { openingHours } = useStoreSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-background/15 bg-foreground text-background/85">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="rounded bg-background p-2 inline-block">
              <Image
                src="/brand/logo.png"
                alt="Foundry Artisan Coffee"
                width={130}
                height={26}
                className="h-5 w-auto object-contain brightness-90"
              />
            </div>
            <p className="text-sm leading-relaxed text-background/70">
              {GLUTEN_FREE_FOOTER}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="https://www.instagram.com/foundry_artisancoffee/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-background/85 hover:text-background"
              >
                <Instagram className="h-4 w-4" />
                <span>@foundry_artisancoffee</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-background">
              Catalog & Pages
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/menu"
                  className="transition-colors hover:text-background"
                >
                  Full Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/specials"
                  className="transition-colors hover:text-background"
                >
                  Rotating Specials
                </Link>
              </li>
              <li>
                <Link
                  href="/story"
                  className="transition-colors hover:text-background"
                >
                  Our Kitchen & Story
                </Link>
              </li>
              <li>
                <Link
                  href="/#visit"
                  className="transition-colors hover:text-background"
                >
                  Hours & Directions
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 text-xs text-background/60 hover:text-background/85"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours Summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-background">
              Trading Hours
            </h3>
            <ul className="mt-4 space-y-1.5 text-xs text-background/70">
              {openingHours.rows.map((row, idx) => (
                <li
                  key={idx}
                  className={`flex justify-between ${
                    idx !== openingHours.rows.length - 1
                      ? "border-b border-background/15 pb-1"
                      : "pt-0.5"
                  }`}
                >
                  <span>{row.label}</span>
                  <span className="font-semibold text-background/85">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Location */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-background">
              Find Our Bench
            </h3>
            <div className="mt-4 space-y-2 text-xs leading-relaxed text-background/70">
              <p className="font-medium text-background/85">
                Level 3, Indooroopilly Shopping Centre
              </p>
              <p>322 Moggill Rd, Indooroopilly QLD 4068</p>
              <p className="pt-2 text-[11px] text-background/55">
                Located on Level 3 near the food court & cinema entrance.
                Undercover parking available.
              </p>
            </div>
          </div>
        </div>

        {/* Base Copyright & Privacy */}
        <div className="mt-12 border-t border-background/15 pt-6 text-xs text-background/55">
          <p className="mb-5 max-w-3xl leading-relaxed">
            We collect anonymous visit statistics (device type, approximate
            location and pages viewed) to improve the menu. If you join Foundry
            Rewards we keep your first name and mobile number so we can apply your
            perk — never sold, never shared, and you can ask us to remove it at
            the counter.
          </p>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p suppressHydrationWarning>
              © {currentYear} Foundry Artisan Coffee. 100% Gluten Free.
              Brisbane, Australia.
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-background/70">
                Brewed with{" "}
                {/* `primary` is admin-editable and can end up dark on this
                    surface — `primary-foreground` is a fixed light token. */}
                <Heart
                  className="h-3.5 w-3.5 fill-current text-primary-foreground"
                  aria-hidden="true"
                />{" "}
                in Queensland
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
