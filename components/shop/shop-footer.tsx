import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, MapPin, Clock, ShieldCheck, Heart } from "lucide-react";

export function ShopFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#3a352c] bg-[#1b1915] text-[#cfc9b4]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="rounded bg-[#f3f0e1] p-2 inline-block">
              <Image
                src="/brand/logo.png"
                alt="Foundry Artisan Coffee"
                width={130}
                height={26}
                className="h-5 w-auto object-contain brightness-90"
              />
            </div>
            <p className="text-sm leading-relaxed text-[#a8a28e]">
              A 100% gluten-free kitchen in Indooroopilly. No wheat on the
              premises, no shared toasters, no asking required.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#cfc9b4] hover:text-[#f3f0e1]"
              >
                <Instagram className="h-4 w-4" />
                <span>@foundryartisancoffee</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3f0e1]">
              Catalog & Pages
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/menu"
                  className="transition-colors hover:text-[#f3f0e1]"
                >
                  Full Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/specials"
                  className="transition-colors hover:text-[#f3f0e1]"
                >
                  Rotating Specials
                </Link>
              </li>
              <li>
                <Link
                  href="/#story"
                  className="transition-colors hover:text-[#f3f0e1]"
                >
                  Our Kitchen & Story
                </Link>
              </li>
              <li>
                <Link
                  href="/#visit"
                  className="transition-colors hover:text-[#f3f0e1]"
                >
                  Hours & Directions
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 text-xs text-[#8e8979] hover:text-[#cfc9b4]"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours Summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3f0e1]">
              Trading Hours
            </h3>
            <ul className="mt-4 space-y-1.5 text-xs text-[#a8a28e]">
              <li className="flex justify-between border-b border-[#2d2820] pb-1">
                <span>Mon – Wed, Fri</span>
                <span className="font-semibold text-[#cfc9b4]">6:30am – 5:30pm</span>
              </li>
              <li className="flex justify-between border-b border-[#2d2820] pb-1">
                <span>Thursday (Late)</span>
                <span className="font-semibold text-[#cfc9b4]">6:30am – 9:00pm</span>
              </li>
              <li className="flex justify-between border-b border-[#2d2820] pb-1">
                <span>Saturday</span>
                <span className="font-semibold text-[#cfc9b4]">7:00am – 5:00pm</span>
              </li>
              <li className="flex justify-between pt-0.5">
                <span>Sunday</span>
                <span className="font-semibold text-[#cfc9b4]">8:00am – 4:00pm</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Location */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3f0e1]">
              Find Our Bench
            </h3>
            <div className="mt-4 space-y-2 text-xs leading-relaxed text-[#a8a28e]">
              <p className="font-medium text-[#cfc9b4]">
                Level 3, Indooroopilly Shopping Centre
              </p>
              <p>322 Moggill Rd, Indooroopilly QLD 4068</p>
              <p className="pt-2 text-[11px] text-[#85806f]">
                Located on Level 3 near the food court & cinema entrance.
                Undercover parking available.
              </p>
            </div>
          </div>
        </div>

        {/* Base Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#2d2820] pt-6 text-xs text-[#85806f] sm:flex-row">
          <p>
            © {currentYear} Foundry Artisan Coffee. 100% Gluten Free. Brisbane,
            Australia.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#85806f]">
              Brewed with <Heart className="h-3 w-3 fill-current text-[#a35d39]" /> in Queensland
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
