/** Matches a price with at most two decimal places, e.g. "6", "6.8", "20.90". */
export const PRICE_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export function formatAUD(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return aud.format(n);
}

/**
 * Turns whatever an admin typed into the canonical string we send to Postgres.
 * Returns an empty string for blank input.
 */
export function normalisePriceInput(raw: string): string {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return "";
  if (!PRICE_PATTERN.test(cleaned)) return cleaned;
  const [whole, decimals = ""] = cleaned.split(".");
  return decimals ? `${whole}.${decimals}` : whole;
}

export function priceOrNull(raw: string | undefined | null): string | null {
  const value = normalisePriceInput(raw ?? "");
  return value === "" ? null : value;
}
