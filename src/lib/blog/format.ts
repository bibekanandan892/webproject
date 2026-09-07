const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Formats a YYYY-MM-DD frontmatter date as "Sep 7, 2026".
 *
 * Done by hand rather than through `Date` so server and client always agree —
 * `new Date("2026-09-07")` is UTC midnight and can render as the previous day
 * in a negative-offset timezone, which would trip hydration.
 */
export function formatPostDate(date: string): string {
  const [year, month, day] = date.split("-");
  const label = MONTHS[Number(month) - 1];
  if (!label) return date;
  return `${label} ${Number(day)}, ${year}`;
}
