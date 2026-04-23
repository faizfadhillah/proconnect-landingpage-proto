// utils/format.js
export function getTimezoneName() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDate(date, locale = "en-GB", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: clientTimezone,
    ...options,
  }).format(new Date(date));
}

export function formatDateWithDay(date, locale = "en-GB", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: clientTimezone,
    ...options,
  }).format(new Date(date));
}

export function formatDateWithoutWeekday(date, locale = "en-GB", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: clientTimezone,
    ...options,
  }).format(new Date(date));
}

export function formatDateTimeShort(date, locale = "id-ID", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: clientTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  }).format(new Date(date));
}

export function formatDateShort(date, locale = "en-GB", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: clientTimezone,
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date, locale = "en-GB", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",

    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Set to true for 12-hour format
    timeZone: clientTimezone,
    ...options,
  }).format(new Date(date));
}

export function formatTime(date, locale = "en-GB", options = {}) {
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Set to true for 12-hour format
    timeZone: clientTimezone,
    ...options,
  }).format(new Date(date));
}

export function formatTimeAgo(date, locale = "en-GB") {
  if (!date) return "";

  // Create dates in the client timezone
  const now = new Date();
  const past = new Date(date);

  // Calculate the difference in milliseconds
  const diffTime = Math.abs(now - past);

  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60)
    return diffSeconds <= 1 ? "1 second ago" : `${diffSeconds} seconds ago`;
  if (diffMinutes < 60)
    return diffMinutes <= 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  if (diffHours < 24)
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  if (diffDays < 30)
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  if (diffMonths < 12)
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}

// Helper function to format dates consistently to yyyy-mm-dd
export function formatDateToYYYYMMDD(date) {
  if (!date) return null;

  // If it's already a string in the correct format, return it
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // If it's a Date object or other format, convert it
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatNumber(number, locale = "en-GB", options = {}) {
  return new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(number);
}

export function capitalizeWords(text) {
  if (!text) return "";
  text = text.toLowerCase();
  text = text.replaceAll("_", " ");
  text = text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  text = text.replaceAll(" Hq", " HQ");
  return text;
}

export function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function colorCandidateStatus(status) {
  if (!status) return "grey";
  const statusColors = {
    CONNECT: "primary", // Biru - Initial connection
    NEED_REVIEW: "warning", // Orange - Perlu review
    PROCESS: "light-blue", // Light blue - Sedang diproses
    SCHEDULE_INTERVIEW: "yellow-darken-3", // Orange - Jadwal interview
    ACCEPTED: "success", // Hijau - Diterima
    REJECTED: "error", // Merah - Ditolak
  };
  return statusColors[status.toUpperCase()] || "grey";
}

export function colorAjsStatus(
  status,
  role = "candidate",
  isInterview = false
) {
  if (!status) return "grey";
  const statusColorsCandidate = {
    PENDING: "grey-darken-3", // No Icon - grey
    SUBMITTED: "warning", // Orange - "Waiting for Review"
    CURRENT: "primary", // Blue - "Need Submission"
    REVISED: "warning", // Yellow - "Need Revision"
    SCHEDULED: "primary", // Blue - "Scheduled"
    RESCHEDULED: "primary", // Blue - "Schedule Updated"
    ACCEPTED: "success", // Green - "Approved"
    FAILED: "error", // Red - "Rejected"
    SKIPPED: "grey-darken-3", // No Icon - grey
  };
  const statusColorsEmployer = {
    PENDING: "grey-darken-3", // No Icon - grey
    SUBMITTED: isInterview ? "warning" : "primary", // Orange - "Waiting for Submission"
    CURRENT: isInterview ? "primary" : "warning", // Blue - "Need Decision"
    REVISED: "warning", // Yellow - "Waiting for Revision"
    SCHEDULED: "primary", // Blue - "Scheduled"
    RESCHEDULED: "primary", // Blue - "Schedule Updated"
    ACCEPTED: "success", // Green - "Approved"
    FAILED: "error", // Red - "Rejected"
    SKIPPED: "grey-darken-3", // No Icon - grey
  };
  return role == "candidate"
    ? statusColorsCandidate[status.toUpperCase()]
    : statusColorsEmployer[status.toUpperCase()] || "grey";
}

export function labelAjsStatus(
  status,
  role = "candidate",
  isInterview = false
) {
  if (!status) return "-";
  const statusLablesCandidate = {
    PENDING: "", // No Icon - empty string
    SUBMITTED: "Waiting for Review",
    CURRENT: "Need Submission",
    REVISED: "Need Revision",
    SCHEDULED: "Scheduled",
    RESCHEDULED: "Schedule Updated",
    ACCEPTED: "Approved",
    FAILED: "Rejected",
    SKIPPED: "Skipped",
  };
  const statusLablesEmployer = {
    PENDING: "", // No Icon - empty string
    SUBMITTED: isInterview ? "Waiting for Submission" : "Need Decision",
    CURRENT: isInterview ? "Need Decision" : "Waiting for Submission",
    REVISED: "Waiting for Revision",
    SCHEDULED: "Scheduled",
    RESCHEDULED: "Schedule Updated",
    ACCEPTED: "Approved",
    FAILED: "Rejected",
    SKIPPED: "Skipped",
  };
  return role == "candidate"
    ? statusLablesCandidate[status.toUpperCase()]
    : statusLablesEmployer[status.toUpperCase()] || status;
}

// Mendapatkan timezone browser
function getClientTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Mendapatkan offset timezone dalam menit
function getTimezoneOffset() {
  return new Date().getTimezoneOffset();
}

// Convert ke format yang lebih readable
function getTimezoneOffsetString() {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset > 0 ? "-" : "+";

  return `GMT${sign}${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}
