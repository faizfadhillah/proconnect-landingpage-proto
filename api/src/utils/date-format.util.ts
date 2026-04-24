/**
 * Format Date object or date string to YYYY-MM-DD string in **local** timezone.
 * For date-only in UTC+7 (WIB), use dateToDateOnlyGMT7 from src/utils/date.util.
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  // If it's already a string in YYYY-MM-DD format, return as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate that we have a valid Date object
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date value: ${date}`);
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}