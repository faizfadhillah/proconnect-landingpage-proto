const UTC_PLUS_7_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns the number of seconds from now until the next 00:00 (midnight) in UTC+7.
 * Midnight UTC+7 = 17:00 UTC on the previous calendar day.
 */
export function getSecondsUntilNextMidnightUTC7(): number {
  const now = new Date();
  const nowUtc7 = new Date(now.getTime() + UTC_PLUS_7_OFFSET_MS);
  const year = nowUtc7.getUTCFullYear();
  const month = nowUtc7.getUTCMonth();
  const date = nowUtc7.getUTCDate();
  // Next midnight UTC+7 = (year, month, date+1) 00:00 UTC+7 = (year, month, date) 17:00 UTC
  const candidate = new Date(Date.UTC(year, month, date, 17, 0, 0, 0));
  const nextMidnightUtc7 =
    now < candidate
      ? candidate
      : new Date(Date.UTC(year, month, date + 1, 17, 0, 0, 0));
  const diffMs = nextMidnightUtc7.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}
