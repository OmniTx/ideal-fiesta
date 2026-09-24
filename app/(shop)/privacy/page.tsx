import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LEGAL_UPDATED, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy · Foundry Artisan Coffee",
  description:
    "What Foundry Artisan Coffee collects when you use this website, why, where it is kept, and how to have it removed.",
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

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Last updated {LEGAL_UPDATED}
      </p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {SITE.name} is a café at {SITE.addressLine1}, {SITE.addressLine2}. This
        page explains what this website records about you, why, and what you can
        ask us to do about it. It describes the site as it is actually built —
        not a generic template.
      </p>

      <Section title="What we collect, and why">
        <p>
          <strong className="text-foreground">Foundry Rewards.</strong> If you
          join, we keep your first name and your mobile number. That is all we
          ask for. We use the number to recognise you at the counter so we can
          apply your welcome perk, and to tell you about specials if you asked us
          to.
        </p>
        <p>
          <strong className="text-foreground">Order tickets.</strong> When you
          build a basket we record what was in it, the total, an optional name
          and an optional note you type. Staff need this to make and ring up your
          order.
        </p>
        <p>
          <strong className="text-foreground">Anonymous visit statistics.</strong>{" "}
          We record your IP address, the approximate city and country it
          resolves to, your device type and model, operating system, browser,
          screen size, the pages you look at and when. We use this to see which
          parts of the menu people actually read and to understand how many
          people are on the site. It is not used to identify you.
        </p>
        <p>
          These statistics are tied to a random identifier stored in your
          browser. It is not your name or your account, and clearing your browser
          storage breaks the link.
        </p>
      </Section>

      <Section title="What we do not collect">
        <p>
          <strong className="text-foreground">No payment details.</strong> You
          pay at the counter, by card or cash, on the café&apos;s own terminal.
          This website never sees or stores a card number.
        </p>
        <p>
          <strong className="text-foreground">No advertising trackers.</strong>{" "}
          There are no third-party advertising or social tracking scripts on this
          site.
        </p>
        <p>
          <strong className="text-foreground">No tracking cookies.</strong> The
          site keeps your basket, your rewards membership and your visit
          identifier in your browser&apos;s local storage, not in cookies, and
          none of it is sent anywhere except back to us.
        </p>
      </Section>

      <Section title="Who else sees it">
        <p>
          Your data is stored with {SITE.dataHost}. The café&apos;s own staff can
          see it, through a sign-in protected admin panel, and only staff
          accounts can read it.
        </p>
        <p>
          To turn your IP address into an approximate location, your browser asks
          a public IP geolocation service directly. That means your IP address is
          visible to whichever of those services answers. No other customer
          detail is sent to them, and the result is cached for the rest of your
          visit so it is not looked up repeatedly.
        </p>
        <p>
          We do not sell your information, and we do not share it with anyone for
          marketing.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can ask us what we hold about you, ask us to correct it, or ask us
          to delete it. Ask at the counter, or contact us using the details on
          the{" "}
          <Link href="/contact" className="font-medium text-foreground underline">
            contact page
          </Link>
          . We may need to confirm it is really you, since the only thing
          identifying your record is the mobile number you gave us.
        </p>
        <p>
          You can also stop the visit statistics by clearing this site&apos;s
          data in your browser settings, or blocking it with your browser&apos;s
          privacy controls.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Rewards membership lasts until you ask us to remove it. Order tickets
          and visit statistics are kept for as long as they are useful for
          running the café and understanding the menu, and are removed on
          request.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Access to customer records is enforced at the database level, not just
          in the admin screen, so a signed-out visitor cannot read anybody&apos;s
          details. Customer contact details are never broadcast or published.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, the date at the top of this page changes with
          it. Continuing to use the site means you accept the current version.
        </p>
      </Section>

      <p className="mt-10 rounded-2xl border border-border bg-muted/60 p-5 text-xs leading-relaxed text-muted-foreground">
        This policy describes how the website is built. It is written from the
        implementation rather than from a template, but it is not legal advice —
        it is worth a quick review by whoever handles the café&apos;s insurance or
        legal affairs before you rely on it.
      </p>
    </div>
  );
}
