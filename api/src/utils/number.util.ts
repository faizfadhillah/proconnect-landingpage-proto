/**
 * Convert a value to a number, returning default if value is null, undefined, empty, or invalid
 * 
 * @param value - Value to convert (can be number, string, null, undefined)
 * @param defaultValue - Default value to return if conversion fails
 * @returns Number value or default value
 * 
 * @example
 * toNumber(5, 10) // returns 5
 * toNumber("5", 10) // returns 5
 * toNumber(null, 10) // returns 10
 * toNumber(undefined, 10) // returns 10
 * toNumber("", 10) // returns 10
 * toNumber("abc", 10) // returns 10
 */
export function toNumber(value: any, defaultValue: number): number {
  if (value == null || value === '') {
    return defaultValue;
  }
  
  const parsed = Number(value);
  if (isNaN(parsed) || !Number.isFinite(parsed)) {
    return defaultValue;
  }
  
  return parsed;
}

