/**
 * Parses the otp_guard_bypass_user_ids config value into an array of user IDs.
 * Supports:
 * - Object: { bypassed_user_ids: "id1,id2,id3" }
 * - String: "id1,id2,id3"
 * Returns [] for null, missing, or invalid value.
 */
export function parseBypassUserIdsFromConfigValue(raw: unknown): string[] {
  let str: string;
  if (
    raw != null &&
    typeof raw === "object" &&
    "bypassed_user_ids" in raw &&
    typeof (raw as { bypassed_user_ids: unknown }).bypassed_user_ids === "string"
  ) {
    str = (raw as { bypassed_user_ids: string }).bypassed_user_ids;
  } else if (typeof raw === "string") {
    str = raw;
  } else {
    return [];
  }
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}
