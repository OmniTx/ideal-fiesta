"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Gift,
  MapPin,
  ShieldCheck,
  Utensils,
  WheatOff,
} from "lucide-react";

import { useRewardsSignup } from "@/components/shop/rewards-provider";
import { RewardsSignup } from "@/components/shop/rewards-signup";
import { GLUTEN_FREE_CLAIM, GLUTEN_FREE_HEADLINE } from "@/lib/copy";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";

const SIGNATURES = [
  {
    name: "Bacon and egg bagel",
    note: "Two fried eggs, bacon, spinach, tomato, aioli & BBQ sauce",
    price: "$20.90",
  },
  {
    name: "Foundry Eggs Benny",
    note: "Two poached eggs, house hollandaise, bacon, ham or salmon",
    price: "From $22.50",
  },
  {
    name: "Smashed Avo & Feta on Toast",
    note: "250g avocado, Persian feta, fresh tomato & lemon",
    price: "$17.90",
  },
  {
    name: "Artisan Toasties",
    note: "Bacon & egg, smoked ham & cheese, or triple melted cheese",
    price: "From $9.90",
  },
];

export default function ShopHomePage() {
  const { openingHours, surcharge } = useStoreSettings();
  const { openSignup, isMember, member } = useRewardsSignup();

  return (
    <div>
      {/* 1. HERO — what we are, plus the two things the client wants seen first */}
      <section className="bg-primary px-4 py-14 text-primary-foreground sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-primary-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Indooroopilly Shopping Centre · Level 3</span>
          </div>

          <h1 className="mt-6 font-display text-5xl leading-[0.95] font-black tracking-tight text-primary-foreground sm:text-7xl">
            Eat without <br className="hidden sm:inline" />
            asking.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/90 sm:text-xl">
            <strong className="font-semibold text-primary-foreground">
              {GLUTEN_FREE_HEADLINE}.
            </strong>{" "}
            {GLUTEN_FREE_CLAIM} Sourdough toasties, eggs benny, seeded bagels and
            house-baked treats — specialty coffee pulled on a custom Synesso.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="/menu"
              className="rounded-full bg-primary-foreground px-7 py-3.5 text-sm font-semibold tracking-wide text-foreground transition hover:bg-card"
            >
              Explore Full Menu
            </Link>
            <button
              type="button"
              onClick={openSignup}
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              <Gift className="h-4 w-4 text-primary-foreground/80" />
              {isMember ? `Rewards · ${member?.member_code}` : "Join Rewards · 10% off"}
            </button>
            <Link
              href="#visit"
              className="rounded-full border border-transparent px-5 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground/80 transition hover:text-primary-foreground"
            >
              Hours & Directions ↓
            </Link>
          </div>
        </div>
      </section>

      {/* 2. WHAT WE ARE — three short cards, no scrolling essay */}
      <section className="border-b border-border bg-background px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary">
              <WheatOff className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-foreground">
              {GLUTEN_FREE_HEADLINE}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We built Foundry from scratch as a gluten-free kitchen rather than
              adding options to an existing one. You never have to ask what&apos;s
              safe.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary">
              <Utensils className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-foreground">
              Real brunch, made to order
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Eggs benny with house-made hollandaise, bacon and egg bagels, feta
              salads, loaded toasties and cabinet treats baked daily.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-foreground">
              Level 3, Indooroopilly
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Near the Event Cinemas entrance and the food pavilion. Free
              undercover customer parking via Gate 4 off Moggill Road.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE DISHES */}
      <section className="border-b border-border bg-background px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Eat anything here
              </h2>
              <p className="mt-2 max-w-xl text-base text-muted-foreground">
                A few of the plates people come back for.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline"
            >
              <span>View the full menu</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 divide-y divide-border border-y border-border">
            {SIGNATURES.map((dish) => (
              <div
                key={dish.name}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:py-5"
              >
                <span className="text-base font-semibold text-foreground sm:text-lg">
                  {dish.name}
                </span>
                <span className="text-sm text-muted-foreground sm:text-right">
                  {dish.note} · <span className="font-semibold">{dish.price}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FOUNDRY REWARDS — promoted well above the footer */}
      <section className="border-b border-border bg-muted px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-primary">
              <Gift className="h-3.5 w-3.5" />
              <span>Foundry Rewards</span>
            </div>

            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {isMember ? `You're in, ${member?.first_name}` : "Join & get 10% off"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isMember
                ? "Show your member code at the counter and we'll apply your welcome perk."
                : "Two fields and you're on the list — secret chef specials and a welcome perk on your next visit."}
            </p>

            <ul className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>10% off your next visit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>First look at rotating chef specials</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>Your number stays with us — never sold, never shared</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            {isMember ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Gift className="h-6 w-6" />
                </span>
                <p className="font-display text-2xl font-black tracking-tight">
                  {member?.member_code}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member?.perk_used_at
                    ? "This perk has already been redeemed."
                    : "Show this code at the counter to claim your perk."}
                </p>
              </div>
            ) : (
              <RewardsSignup source="homepage_rewards" />
            )}
          </div>
        </div>
      </section>

      {/* 5. VISIT */}
      <section id="visit" className="bg-background px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <Clock className="h-4 w-4" />
            <span>Plan Your Visit</span>
          </div>

          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hours & Location
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/70 p-6 sm:p-8">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Opening Hours
              </h3>
              <table className="mt-4 w-full text-sm">
                <tbody className="divide-y divide-border">
                  {openingHours.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-foreground">
                        {row.label}
                      </td>
                      <td className="py-3 text-right font-semibold text-foreground">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {openingHours.note ? (
                <p className="mt-4 text-xs font-medium text-primary">
                  {openingHours.note}
                </p>
              ) : null}

              {surcharge.enabled ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  * {surcharge.text}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card/70 p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Where to Find Us</span>
                </div>

                <p className="mt-4 font-display text-2xl font-bold text-foreground">
                  Indooroopilly Shopping Centre
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Level 3, 322 Moggill Rd, Indooroopilly QLD 4068
                </p>

                <div className="mt-5 flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
                  <p>
                    <strong>Finding our bench:</strong> Level 3, right near the
                    Event Cinemas entrance and the main food pavilion.
                  </p>
                  <p>
                    <strong>Parking:</strong> Free undercover parking, closest
                    bays via Gate 4 off Moggill Road.
                  </p>
                  <p>
                    <strong>Transit:</strong> Next to the Indooroopilly Bus
                    Interchange, four minutes from Indooroopilly Station.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                <Link
                  href="/menu"
                  className="flex-1 rounded-full bg-foreground py-3 text-center text-sm font-semibold text-background transition hover:bg-foreground/85"
                >
                  View Digital Menu
                </Link>
                <Link
                  href="/story"
                  className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
