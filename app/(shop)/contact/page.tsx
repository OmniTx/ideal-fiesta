"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";

import { useStoreSettings } from "@/lib/hooks/use-store-settings";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const { openingHours } = useStoreSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Foundry Home</span>
      </Link>

      <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
        Contact &amp; Find Us
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Where we are</span>
          </div>
          <p className="mt-3 font-display text-lg font-bold text-foreground">
            Indooroopilly Shopping Centre
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {SITE.addressLine1}
            <br />
            {SITE.addressLine2}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            On Level 3, near the Event Cinemas entrance and the food pavilion.
            Free undercover parking, closest via Gate 4 off Moggill Road. Next to
            the Indooroopilly Bus Interchange and a short walk from Indooroopilly
            Station.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <Clock className="h-4 w-4 text-primary" />
            <span>Opening hours</span>
          </div>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-border">
              {openingHours.rows.map((row, index) => (
                <tr key={index}>
                  <td className="py-2.5 font-medium text-foreground">
                    {row.label}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-foreground">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {openingHours.note ? (
            <p className="mt-3 text-xs font-medium text-primary">
              {openingHours.note}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/70 p-5">
        <h2 className="font-display text-base font-semibold text-foreground">
          Get in touch
        </h2>
        <ul className="mt-3 flex flex-col gap-3 text-sm">
          <li className="flex items-center gap-2.5">
            <Instagram className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              {SITE.instagramHandle}
            </a>
            <span className="text-muted-foreground">
              — specials and daily bakes
            </span>
          </li>

          {SITE.email ? (
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <a
                href={`mailto:${SITE.email}`}
                className="font-medium text-foreground underline"
              >
                {SITE.email}
              </a>
            </li>
          ) : null}

          {SITE.phone ? (
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <a
                href={`tel:${SITE.phone}`}
                className="font-medium text-foreground underline"
              >
                {SITE.phone}
              </a>
            </li>
          ) : null}
        </ul>

        {!SITE.email && !SITE.phone ? (
          <p className="mt-4 rounded-xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
            We are counter-service only and do not take bookings or phone-ahead
            orders, so the quickest way to reach us is at the bench on Level 3 or
            by message on Instagram. If you would like an email address or phone
            number published here, tell us and it will appear on this page.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/menu"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-foreground/85"
        >
          View the menu
        </Link>
        <Link
          href="/allergens"
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Allergens &amp; dietary
        </Link>
      </div>
    </div>
  );
}
