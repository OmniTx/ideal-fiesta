export const SYDNEY_TIME_ZONE = "Australia/Sydney";

/**
 * All scheduling and display logic uses Sydney wall-clock time explicitly.
 * We never rely on the browser's local offset.
 */
export function formatSydney(
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TIME_ZONE,
    ...options,
  }).format(date);
}

export interface SydneyParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export function sydneyParts(date: Date = new Date()): SydneyParts {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TIME_ZONE,
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

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

export function isWeekendInSydney(date: Date = new Date()): boolean {
  const { weekday } = sydneyParts(date);
  return weekday === 0 || weekday === 6;
}
