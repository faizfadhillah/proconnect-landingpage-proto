/**
 * Extract last 4 digits from a phone number string
 * Extracts only digits from the string and returns the last 4 characters
 *
 * @param phone - Phone number string (can contain any characters)
 * @returns Last 4 digits as string, or null if phone is empty or has less than 4 digits
 */
export function extractLast4Digits(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }

  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 4) {
    return null;
  }

  return digitsOnly.slice(-4);
}

export interface PhoneAndCountryCode {
  phone: string;
  countryCode: string;
}

/** Common country codes (numeric, no +) for extraction */
const COUNTRY_CODE_PREFIXES: [string, number][] = [
  ['62', 2],   // Indonesia
  ['1', 1],    // US/Canada
  ['44', 2],   // UK
  ['91', 2],   // India
  ['65', 2],   // Singapore
  ['60', 2],   // Malaysia
  ['81', 2],   // Japan
  ['86', 2],   // China
  ['82', 2],   // South Korea
  ['61', 2],   // Australia
];

const DEFAULT_COUNTRY_CODE = '62'; // Indonesia

/**
 * Normalize phone number and country code for SMS/OTP.
 * Handles legacy data where country_code may be null.
 *
 * @param phone - Raw phone number (may have +, spaces, leading 0, e.g. +6282288456789)
 * @param countryCode - Country code from DB (may be null/empty)
 * @returns { phone, countryCode } or null if phone invalid
 *
 * Logic:
 * - Strips +, spaces, dashes from input
 * - If countryCode provided: use it, strip country code or leading 0 from phone
 * - If phone starts with 0: default Indonesia (62), strip 0
 * - If countryCode empty: try extract from phone (62, 1, 44, etc.)
 * - Fallback: Indonesia (62)
 */
export function normalizePhoneAndCountryCode(
  phone: string | null | undefined,
  countryCode?: string | null,
): PhoneAndCountryCode | null {
  if (!phone) return null;

  const digits = phone.trim().replace(/\D/g, '');
  if (digits.length < 8) return null;

  const cc = (countryCode ?? '').trim().replace(/\D/g, '');

  if (cc) {
    let mobile = digits;
    if (mobile.startsWith(cc)) {
      mobile = mobile.slice(cc.length);
    }
    if (mobile.startsWith('0')) {
      mobile = mobile.slice(1);
    }
    return { phone: mobile, countryCode: cc };
  }

  // Country code empty - infer from phone
  if (digits.startsWith('0')) {
    const mobile = digits.slice(1);
    return { phone: mobile, countryCode: DEFAULT_COUNTRY_CODE };
  }

  for (const [prefix, len] of COUNTRY_CODE_PREFIXES) {
    if (digits.startsWith(prefix) && digits.length >= len + 8) {
      const mobile = digits.slice(len);
      return { phone: mobile, countryCode: prefix };
    }
  }

  // Indonesian local: 8xxxxxxxxx (9-10 digits)
  if (digits.startsWith('8') && digits.length >= 9) {
    return { phone: digits, countryCode: DEFAULT_COUNTRY_CODE };
  }

  return { phone: digits, countryCode: DEFAULT_COUNTRY_CODE };
}

