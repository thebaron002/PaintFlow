import { format as fnsFormat } from "date-fns";

/**
 * Safely parses a date string into a Date object.
 * Handles Safari quirks by replacing spaces with 'T' in ISO-like strings.
 * Returns null if parsing fails.
 */
export function safeParseDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  try {
    // Safari does not like "YYYY-MM-DD HH:MM:SS" format — needs the T separator
    const normalized = typeof dateString === "string" 
      ? dateString.replace(" ", "T") 
      : dateString;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Safely formats a date string using date-fns format.
 * Returns the fallback string if parsing fails.
 */
export function safeFormatDate(
  dateString: string | undefined | null,
  formatStr: string,
  fallback: string = "-"
): string {
  const d = safeParseDate(dateString);
  if (!d) return fallback;
  try {
    return fnsFormat(d, formatStr);
  } catch {
    return fallback;
  }
}

/**
 * Safely compares two date strings for sorting.
 * Returns 0 if either date is invalid.
 */
export function safeDateCompare(a: string | undefined | null, b: string | undefined | null): number {
  const dateA = safeParseDate(a);
  const dateB = safeParseDate(b);
  if (!dateA || !dateB) return 0;
  return dateA.getTime() - dateB.getTime();
}
