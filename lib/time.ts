/**
 * Time helpers for the storefront.
 *
 * The café is in Indooroopilly, Brisbane — Australia/Brisbane (AEST, no DST).
 * All day-of-week reasoning uses the venue's wall clock, never the visitor's.
 */
export const VENUE_TIME_ZONE = "Australia/Brisbane";

const DAY_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export function formatVenueTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: VENUE_TIME_ZONE,
    ...options,
  }).format(date);
}

export interface VenueParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export function venueParts(date: Date = new Date()): VenueParts {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: VENUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: shortDays.indexOf(get("weekday")),
  };
}

export function isWeekendAtVenue(date: Date = new Date()): boolean {
  const { weekday } = venueParts(date);
  return weekday === 0 || weekday === 6;
}

function dayIndexFromToken(token: string): number | null {
  const cleaned = token.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return null;
  if (DAY_INDEX[cleaned] !== undefined) return DAY_INDEX[cleaned];
  const prefix = Object.keys(DAY_INDEX).find(
    (key) => key.length >= 3 && cleaned.startsWith(key),
  );
  return prefix ? DAY_INDEX[prefix] : null;
}

/**
 * Picks the opening-hours row that applies today.
 *
 * Understands single days ("Saturday"), ranges ("Monday to Wednesday",
 * "Mon–Fri"), and grouped days ("Saturday & Sunday", wrapping across the
 * week). Holiday rows are skipped so they never win on a normal weekday.
 */
export function findTodayHours<T extends { label: string; value: string }>(
  rows: T[],
  date: Date = new Date(),
): T | null {
  const weekdays = rows.filter((row) => !/holiday|closed for/i.test(row.label));
  const candidates = weekdays.length > 0 ? weekdays : rows;
  if (candidates.length === 0) return null;

  const { weekday } = venueParts(date);

  for (const row of candidates) {
    const tokens = row.label
      .toLowerCase()
      .split(/\s*(?:-|–|—|\bto\b|&|\band\b|,|\/)\s*/)
      .filter(Boolean);
    const indices = tokens
      .map(dayIndexFromToken)
      .filter((value): value is number => value !== null);

    if (indices.length === 1 && indices[0] === weekday) return row;

    if (indices.length >= 2) {
      const start = indices[0];
      const end = indices[indices.length - 1];
      const inRange =
        start <= end
          ? weekday >= start && weekday <= end
          : weekday >= start || weekday <= end;
      if (inRange) return row;
    }
  }

  const looseMatch = candidates.find((row) =>
    row.label.toLowerCase().includes(
      new Intl.DateTimeFormat("en-AU", {
        timeZone: VENUE_TIME_ZONE,
        weekday: "long",
      })
        .format(date)
        .toLowerCase(),
    ),
  );

  return looseMatch ?? candidates[0];
}
