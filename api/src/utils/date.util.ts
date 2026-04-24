/** GMT+7 = UTC+7 */
const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Start of the given date at 00:00 GMT+7 as UTC Date.
 * Use for open/close date checks (e.g. job schedule).
 */
export function startOfDayGMT7(date: Date): Date {
  const d = new Date(date.getTime() + GMT7_OFFSET_MS);
  const y = d.getUTCFullYear(),
    m = d.getUTCMonth(),
    day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day, 0, 0, 0, 0) - GMT7_OFFSET_MS);
}

/**
 * Start of today 00:00 GMT+7 as UTC Date.
 */
export function getStartOfTodayGMT7(): Date {
  return startOfDayGMT7(new Date());
}

/**
 * Start of yesterday 00:00 GMT+7 as UTC Date.
 * Used for auto-close threshold (1-day buffer: close_date 7 Feb → close on 8 Feb run).
 */
export function getStartOfYesterdayGMT7(): Date {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return new Date(getStartOfTodayGMT7().getTime() - ONE_DAY_MS);
}

/**
 * Start of tomorrow 00:00 GMT+7 as UTC Date.
 */
export function tomorrowStartGMT7(): Date {
  const todayStart = startOfDayGMT7(new Date());
  return new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Parse date-only string (YYYY-MM-DD) as 00:00 GMT+7 and return as UTC Date.
 * Used in DTO Transform for request body. DTO uses @Type(() => String) so value is always string (bypasses enableImplicitConversion).
 * @param value - Date string in YYYY-MM-DD format (GMT+7)
 * @returns Date object representing 00:00 GMT+7 of that date (stored as UTC instant), or null if invalid/empty
 * @example parseDateOnlyGMT7("2025-03-01") → Date(2025-02-28T17:00:00.000Z) = 2025-03-01 00:00 GMT+7
 */
export function parseDateOnlyGMT7(value: string | null | undefined): Date | null {
  if (value === "" || value === undefined) return null;
  if (value === null) return null;
  if (typeof value !== "string") return null;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateOnlyMatch) return null;

  const year = parseInt(dateOnlyMatch[1], 10);
  const month = parseInt(dateOnlyMatch[2], 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateOnlyMatch[3], 10);

  // Create Date at 00:00 GMT+7 (stored as UTC)
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - GMT7_OFFSET_MS);
}

/**
 * Convert Date (UTC instant) to date-only string (YYYY-MM-DD) in GMT+7 timezone.
 * @param date - Date object (UTC instant from DB/backend)
 * @returns Date-only string in YYYY-MM-DD format representing the date in GMT+7, or null if input is null
 * @example dateToDateOnlyGMT7(new Date("2025-02-28T17:00:00.000Z")) returns "2025-03-01"
 */
export function dateToDateOnlyGMT7(date: Date | null | undefined): string | null {
  if (date == null) return null;

  // Convert UTC instant to GMT+7 date
  const gmt7Date = new Date(date.getTime() + GMT7_OFFSET_MS);
  const year = gmt7Date.getUTCFullYear();
  const month = String(gmt7Date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(gmt7Date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
