"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  WheatOff,
  Coffee,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Utensils,
} from "lucide-react";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";
import { captureCustomerLead } from "@/lib/analytics";

export default function ShopHomePage() {
  const { openingHours, surcharge } = useStoreSettings();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) return;

    setIsSubmitting(true);
    await captureCustomerLead({
      name,
      phone,
      email,
      source: "homepage_regulars",
    });
    setIsSubmitting(false);
    setSubscribed(true);
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="bg-[#46543a] px-4 py-16 text-[#f2f1e4] sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-[#cfd8bd]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Dedicated Gluten-Free Kitchen</span>
          </div>

          <h1 className="mt-6 font-display text-5xl font-black tracking-tight leading-[0.95] text-white sm:text-7xl md:text-8xl">
            Eat without <br className="hidden sm:inline" />
            asking.
          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-[#e3e5d4] sm:text-2xl">
            <strong className="font-semibold text-white">
              Every single item at Foundry is 100% gluten free.
            </strong>{" "}
            No wheat on the premises, no shared toasters, no
            cross-contamination.
          </p>

          <p className="mt-3 max-w-xl text-base text-[#cfd8bd]">
            Sourdough toasties, eggs benny, seeded bagels, and house-baked sweet
            treats on Level 3 of Indooroopilly Shopping Centre.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="/menu"
              className="rounded-full bg-[#f2f1e4] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#1b1915] transition hover:bg-white"
            >
              Explore Full Menu
            </Link>
            <Link
              href="/specials"
              className="flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-[#cfd8bd]" />
              Foundry Specials
            </Link>
            <Link
              href="#visit"
              className="rounded-full border border-transparent px-5 py-3.5 text-sm font-semibold tracking-wide text-[#cfd8bd] transition hover:text-white"
            >
              Hours & Directions ↓
            </Link>
          </div>

          <p className="mt-8 max-w-md text-xs text-[#bcc4aa]">
            Specialty coffee pulled on a custom Synesso. Full dairy, oat,
            almond, soy, and lactose-free milk options available.
          </p>
        </div>
      </section>

      {/* 2. ASSURANCES: What 100% Gluten Free Means */}
      <section className="border-b border-[#dbd5c0] bg-[#f3f0e1] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#1b1915] sm:text-4xl">
            What 100% gluten free actually means
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[#6e6a5a]">
            Most cafes offer &ldquo;gluten free options&rdquo; kept in the same display case
            as standard croissants. We built Foundry from scratch to eliminate
            cross-contamination completely.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eae5d2] text-[#46543a]">
                <WheatOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b1915]">
                  No wheat on the premises
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6e6a5a]">
                  We never buy standard wheat bread or pastries. There is zero
                  flour floating in the air and no shared sandwich presses.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eae5d2] text-[#46543a]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b1915]">
                  Safe for Coeliac disease
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6e6a5a]">
                  Our staff understand cross-contact protocols because we live
                  it every day. You don&apos;t have to explain your dietary
                  requirements.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eae5d2] text-[#46543a]">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b1915]">
                  Real brunch and kitchen plates
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6e6a5a]">
                  Eggs benny with house-made hollandaise, bacon and egg bagels,
                  feta salads, and loaded toasties made fresh to order.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eae5d2] text-[#46543a]">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b1915]">
                  Artisan specialty coffee
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6e6a5a]">
                  Double ristretto espresso extractions, ceremonial Japanese
                  matcha, single-origin cold brews, and house iced teas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PHOTO BAND */}
      <section className="relative border-b border-[#dbd5c0] bg-[#1b1915] text-[#cfc9b4]">
        <div className="relative h-64 w-full sm:h-96 md:h-[420px]">
          <Image
            src="/images/cafe-band.jpg"
            alt="Foundry Artisan Coffee bench and barista"
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-90"
          />
        </div>
        <div className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="text-base leading-relaxed sm:text-lg">
              <strong className="text-white font-semibold">
                Timber panelling, live plants above the machine, and a Synesso
                running all day.
              </strong>{" "}
              Foundry sits on Level 3 of Indooroopilly Shopping Centre. Pull up a
              stool at the bench or grab a table for a relaxed morning coffee.
            </p>
          </div>
        </div>
      </section>

      {/* 4. EAT ANYTHING HERE: Signature Dishes */}
      <section className="border-b border-[#dbd5c0] bg-[#f3f0e1] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1b1915] sm:text-4xl">
                Eat anything here
              </h2>
              <p className="mt-2 max-w-xl text-base text-[#6e6a5a]">
                From classic breakfast bagels to loaded sourdough toasties and
                sweet cabinet treats, order with absolute peace of mind.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 font-semibold text-[#1b1915] hover:underline"
            >
              <span>View full 58-item menu</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 divide-y divide-[#dbd5c0] border-y border-[#dbd5c0]">
            <div className="flex items-baseline justify-between py-4 sm:py-5">
              <span className="text-base font-semibold text-[#1b1915] sm:text-lg">
                Bacon and egg bagel
              </span>
              <span className="text-sm text-[#6e6a5a]">
                Two fried eggs, bacon, spinach, tomato, aioli & BBQ sauce · $20.90
              </span>
            </div>

            <div className="flex items-baseline justify-between py-4 sm:py-5">
              <span className="text-base font-semibold text-[#1b1915] sm:text-lg">
                Foundry Eggs Benny
              </span>
              <span className="text-sm text-[#6e6a5a]">
                Two poached eggs, house hollandaise, bacon, ham or salmon · From $22.50
              </span>
            </div>

            <div className="flex items-baseline justify-between py-4 sm:py-5">
              <span className="text-base font-semibold text-[#1b1915] sm:text-lg">
                Smashed Avo & Feta on Toast
              </span>
              <span className="text-sm text-[#6e6a5a]">
                250g avocado, Persian feta, fresh tomato & lemon · $17.90
              </span>
            </div>

            <div className="flex items-baseline justify-between py-4 sm:py-5">
              <span className="text-base font-semibold text-[#1b1915] sm:text-lg">
                Artisan Toasties
              </span>
              <span className="text-sm text-[#6e6a5a]">
                Bacon & egg, smoked ham & cheese, or triple melted cheese · From $9.90
              </span>
            </div>

            <div className="flex items-baseline justify-between py-4 sm:py-5">
              <span className="text-base font-semibold text-[#1b1915] sm:text-lg">
                Rotating Foundry Specials
              </span>
              <span className="text-sm text-[#6e6a5a]">
                Smoked salmon, pesto & eggs, and seasonal breakfast plates · From $15.50
              </span>
            </div>

            <div className="flex items-baseline justify-between py-4 sm:py-5">
              <span className="text-base font-semibold text-[#1b1915] sm:text-lg">
                Sweet treats in front cabinet
              </span>
              <span className="text-sm text-[#6e6a5a]">
                House-baked slices, brownies, muffins & pastries · Baked fresh daily
              </span>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/menu"
              className="inline-block rounded-full bg-[#1b1915] px-8 py-3.5 text-sm font-semibold tracking-wide text-[#f3f0e1] transition hover:bg-[#3b2a1e]"
            >
              See the full menu
            </Link>
          </div>
        </div>
      </section>

      {/* 5. STORY SECTION: Built Around the Bench */}
      <section id="story" className="border-b border-[#dbd5c0] bg-[#f3f0e1] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1b1915] sm:text-4xl">
                Built around the bench
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-[#6e6a5a]">
                <p>
                  Foundry sits on Level 3 of Indooroopilly Shopping Centre.
                  Natural timber panelling, live greenery climbing above the
                  cup racks, and our custom Synesso espresso machine pulling
                  rich double ristretto shots from morning until afternoon.
                </p>
                <p>
                  Going 100% gluten free was not a marketing angle—it was an
                  intentional kitchen decision. It means that someone living
                  with Coeliac disease or gluten intolerance can walk up, pick
                  anything off the menu, and enjoy good food without having to
                  interview the barista.
                </p>
                <p>
                  We source our dairy locally, offer five specialty plant milks,
                  and make our hollandaise, dressings, and savory toasties to
                  order every single day.
                </p>
              </div>
            </div>

            <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-[#dbd5c0] shadow-sm sm:h-96">
              <Image
                src="/images/cafe-story.jpg"
                alt="Foundry cafe interior and coffee bench"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. SIGNUP / NEWSLETTER & PERKS */}
      <section className="border-b border-[#dbd5c0] bg-[#eae5d2] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#46543a]/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#46543a]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Foundry Perks & Secret Specials</span>
            </div>

            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#1b1915]">
              Join the regulars
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6a5a]">
              Get secret chef specials, priority bench alerts, and a 10% welcome perk. No spam, ever.
            </p>

            {subscribed ? (
              <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-[#46543a] p-5 text-sm font-semibold text-[#f0efe2] shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#cfd8bd]" />
                <div>
                  <p>You&apos;re on the list! Welcome to Foundry Club.</p>
                  <p className="text-xs font-normal opacity-90">We look forward to seeing you at the Indooroopilly bench.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-6 space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full rounded-full border border-[#dbd5c0] bg-[#f3f0e1] px-5 py-3 text-sm text-[#1b1915] placeholder:text-[#6e6a5a] focus:border-[#46543a] focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile Number (e.g. 0400 123 456)"
                    className="w-full rounded-full border border-[#dbd5c0] bg-[#f3f0e1] px-5 py-3 text-sm text-[#1b1915] placeholder:text-[#6e6a5a] focus:border-[#46543a] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="min-w-[240px] flex-1 rounded-full border border-[#dbd5c0] bg-[#f3f0e1] px-5 py-3 text-sm text-[#1b1915] placeholder:text-[#6e6a5a] focus:border-[#46543a] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-[#1b1915] px-7 py-3 text-sm font-semibold text-[#f3f0e1] transition hover:bg-[#3b2a1e] disabled:opacity-50"
                  >
                    {isSubmitting ? "Joining..." : "Join Regulars"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. VISIT / OPENING HOURS & LOCATION */}
      <section id="visit" className="bg-[#f3f0e1] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#46543a] uppercase">
            <Clock className="h-4 w-4" />
            <span>Plan Your Visit</span>
          </div>

          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1b1915] sm:text-4xl">
            Hours & Location
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {/* Hours Table */}
            <div className="rounded-2xl border border-[#dbd5c0] bg-white/70 p-6 sm:p-8">
              <h3 className="text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                Opening Hours
              </h3>
              <table className="mt-4 w-full text-sm">
                <tbody className="divide-y divide-[#dbd5c0]">
                  {openingHours.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-[#1b1915]">
                        {row.label}
                      </td>
                      <td className="py-3 text-right font-semibold text-[#1b1915]">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {openingHours.note && (
                <p className="mt-4 text-xs font-medium text-[#46543a]">
                  {openingHours.note}
                </p>
              )}

              {surcharge.enabled && (
                <p className="mt-2 text-xs text-[#6e6a5a]">
                  * {surcharge.text}
                </p>
              )}
            </div>

            {/* Address & Parking Details */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#dbd5c0] bg-white/70 p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#6e6a5a] uppercase">
                  <MapPin className="h-4 w-4 text-[#46543a]" />
                  <span>Where to Find Us</span>
                </div>

                <p className="mt-4 font-display text-2xl font-bold text-[#1b1915]">
                  Indooroopilly Shopping Centre
                </p>
                <p className="mt-1 text-sm text-[#6e6a5a]">
                  Level 3, 322 Moggill Rd, Indooroopilly QLD 4068
                </p>

                <div className="mt-6 space-y-3 text-xs leading-relaxed text-[#6e6a5a]">
                  <p>
                    <strong>Finding our bench:</strong> We are located on Level 3,
                    situated right near the entrance to Event Cinemas and the
                    main food pavilion.
                  </p>
                  <p>
                    <strong>Parking:</strong> Free undercover customer parking
                    available in the shopping centre car parks. The closest bays
                    are accessible via Gate 4 off Moggill Road.
                  </p>
                  <p>
                    <strong>Transit:</strong> Directly adjacent to the
                    Indooroopilly Bus Interchange and a short 4-minute walk from
                    Indooroopilly Train Station.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#dbd5c0]">
                <Link
                  href="/menu"
                  className="block w-full rounded-full bg-[#1b1915] py-3 text-center text-sm font-semibold text-[#f3f0e1] transition hover:bg-[#3b2a1e]"
                >
                  View Digital Menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
