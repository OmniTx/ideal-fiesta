import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LEGAL_UPDATED, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Rewards · Foundry Artisan Coffee",
  description:
    "How ordering from the menu works, what an order number means, and the terms of the Foundry Rewards programme.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
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
        Terms &amp; Rewards
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Last updated {LEGAL_UPDATED}
      </p>

      <Section title="Using this site">
        <p>
          This site is run by {SITE.name}, {SITE.addressLine1},{" "}
          {SITE.addressLine2}. By using it you accept these terms. If you do not
          accept them, please just order at the counter — you are very welcome to.
        </p>
      </Section>

      <Section title="The menu and prices">
        <p>
          Prices are in Australian dollars and include GST. The menu, prices and
          availability change during the day, and an item can sell out. Where a
          price differs between the site and the café, the price at the counter
          applies.
        </p>
      </Section>

      <Section title="Baskets and order numbers">
        <p>
          Building a basket on this site is a way to tell us what you want. It is
          <strong className="text-foreground"> not </strong>
          a payment and not a completed order. When you submit a basket you get
          an order number, and you show that number at the counter, where staff
          ring the items up and take payment on the café&apos;s terminal.
        </p>
        <p>
          Because no money changes hands here, submitting a basket does not
          create a binding sale. We may refuse or change an order at the counter
          — for example if an item has sold out, or if a price on the site is
          wrong.
        </p>
        <p>
          Your basket is a request, not a reservation, and it is not a promise
          that anything will be ready at a particular time.
        </p>
      </Section>

      <Section title="Cancelling a ticket">
        <p>
          You can cancel your own ticket from your phone while it is still
          untouched — that is, before staff have started making it — and within a
          short window after submitting it. Once the café has started preparing
          it, it can no longer be cancelled from the website; please speak to the
          counter instead. The window is set by the café and can change.
        </p>
      </Section>

      <Section title="Foundry Rewards">
        <p>
          Joining is free. You give us a first name and a mobile number, and in
          return you get a welcome perk — currently 10% off your next visit —
          plus occasional word of chef specials.
        </p>
        <p>
          The perk is for the member, is redeemed once, and is applied by staff
          at the counter. It cannot be exchanged for cash and does not apply
          retrospectively to orders already paid for.
        </p>
        <p>
          Only one membership per mobile number. If you sign up with a number
          that is already on the list, you will be told you are already a member
          rather than being signed up twice.
        </p>
        <p>
          We can change or end the programme, and change the perk, at any time.
          If we end it we will honour perks already earned.
        </p>
      </Section>

      <Section title="Allergens and dietary needs">
        <p>
          Foundry is a dedicated gluten free kitchen. Even so, this website
          cannot cover every dietary question — please read the{" "}
          <Link
            href="/allergens"
            className="font-medium text-foreground underline"
          >
            allergen page
          </Link>{" "}
          and speak to staff before ordering if you have a serious allergy.
        </p>
      </Section>

      <Section title="Content on this site">
        <p>
          We try to keep the menu accurate, but descriptions, prices and
          availability are provided as-is. The site&apos;s text, photography and
          design belong to the café and are not to be reused without permission.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          Nothing in these terms limits your rights under the Australian Consumer
          Law, including the consumer guarantees. Beyond what the law requires,
          we are not liable for any loss arising from your use of this website or
          from a basket that could not be fulfilled at the counter.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms. The date at the top of this page changes
          when we do.
        </p>
      </Section>

      <p className="mt-10 rounded-2xl border border-border bg-muted/60 p-5 text-xs leading-relaxed text-muted-foreground">
        These terms match how the site actually behaves. They are not legal
        advice — worth a review by whoever handles the café&apos;s legal affairs
        before you rely on them.
      </p>
    </div>
  );
}
