/**
 * The business facts that more than one page needs.
 *
 * Kept here so the contact page and the legal pages cannot drift apart, and so
 * there is one obvious place to add a phone number or an email address when the
 * cafe supplies them — anything left blank is simply not rendered.
 */
export const SITE = {
  name: "Foundry Artisan Coffee",
  addressLine1: "Level 3, Indooroopilly Shopping Centre",
  addressLine2: "322 Moggill Rd, Indooroopilly QLD 4068",
  locality: "Brisbane, Queensland, Australia",
  instagramUrl: "https://www.instagram.com/foundry_artisancoffee/",
  instagramHandle: "@foundry_artisancoffee",
  /** Blank until the cafe gives us one. Pages skip whatever is empty. */
  email: "",
  phone: "",
  /** Where customer data actually lives, for the privacy policy. */
  dataHost: "Supabase (PostgreSQL), hosted in Sydney, Australia",
} as const;

export const LEGAL_UPDATED = "24 September 2026";

export const LEGAL_LINKS = [
  { href: "/contact", label: "Contact & Find Us" },
  { href: "/allergens", label: "Allergens & Dietary" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Rewards" },
];
