/**
 * Convert string to title case
 * Example: "hello world" -> "Hello World"
 * 
 * @param str - String to convert to title case
 * @returns String in title case format
 */
export function toTitleCase(str: string): string {
  if (!str) {
    return str;
  }

  // Split by spaces and filter out empty strings (handles multiple spaces)
  const words = str.split(" ").filter(word => word.length > 0);
  const titleCaseWords = words.map((word) => {
    // Capitalize first character, lowercase the rest
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  });

  return titleCaseWords.join(" ");
}

/**
 * Convert string to URL-friendly slug
 * Example: "Hello World!" -> "hello-world"
 * 
 * @param str - String to convert to slug
 * @returns URL-friendly slug string
 */
export function toSlug(str: string): string {
  if (!str) {
    return "";
  }

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Format date to YYYYMMDD format in GMT+7 timezone
 * This ensures consistency with how open_date is stored (as UTC representing 00:00 GMT+7)
 * 
 * @param date - Date to format (stored as UTC)
 * @returns Date string in YYYYMMDD format based on GMT+7 timezone
 */
export function formatDateToYYYYMMDD(date: Date | string | null): string {
  if (!date) {
    return "";
  }

  const d = new Date(date);

  // Convert UTC timestamp to GMT+7 for date extraction
  // open_date: stored as UTC representing 00:00 GMT+7 (e.g., 2025-01-01 17:00 UTC = 2025-01-02 00:00 GMT+7)
  // created_at: stored as UTC timestamp (e.g., 2025-01-02 10:00 UTC = 2025-01-02 17:00 GMT+7)
  // To get the correct GMT+7 date, we add 7 hours offset to UTC timestamp
  const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000;
  const gmt7Timestamp = d.getTime() + GMT7_OFFSET_MS;
  const gmt7Date = new Date(gmt7Timestamp);

  // Extract date components using UTC methods
  // After adding 7 hours, the UTC date components represent the GMT+7 date
  const year = gmt7Date.getUTCFullYear();
  const month = String(gmt7Date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(gmt7Date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Generate job slug with pattern: jobTitle-brandName-publishDate-sequence
 * Example: "cook-restaurant-nusantara-group-20260101-1"
 * 
 * @param jobTitle - Job title
 * @param brandName - Company brand name
 * @param publishDate - Publish date (open_date or created_at)
 * @param sequence - Optional sequence number (starts from 2 if provided)
 * @returns Generated slug
 */
export function generateJobSlug(
  jobTitle: string,
  brandName: string,
  publishDate: Date | string | null,
  sequence?: number
): string {
  const titleSlug = toSlug(jobTitle);
  const brandSlug = toSlug(brandName);
  const dateStr = formatDateToYYYYMMDD(publishDate);

  const parts = [titleSlug, brandSlug, dateStr];

  // Add sequence if provided (sequence starts from 2)
  if (sequence !== undefined && sequence >= 2) {
    parts.push(String(sequence));
  }

  return parts.filter(Boolean).join("-");
}

/**
 * Strip surrounding double quotes from token (avoids 401 when token was JSON-stringified)
 * 
 * @param raw - String to strip quotes from
 * @returns String with quotes stripped
 */
export function stripTokenQuotes(raw: string): string {
  if (typeof raw !== 'string') return raw;
  let s = raw.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1);
  }
  return s;
}