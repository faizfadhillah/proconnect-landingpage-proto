import { LoggingService } from "src/logs/logs.service";

/**
 * Utility class for parsing and normalizing filter objects
 */
export class FiltersUtil {
  /**
   * Ensures parsed filters is an object, not a string or other type
   * This is useful when filters come as URL-encoded JSON strings
   * 
   * @param parsedFilters The result from FieldsService.parseFilters()
   * @param context Optional context string for logging (e.g., "job-search", "company-search")
   * @param loggingService Optional LoggingService for logging
   * @returns A normalized filter object
   */
  static ensureFiltersObject(
    parsedFilters: any,
    context?: string,
    loggingService?: LoggingService
  ): Record<string, any> {
    let filtersObj: Record<string, any> = {};

    if (parsedFilters) {
      if (
        typeof parsedFilters === "object" &&
        !Array.isArray(parsedFilters) &&
        parsedFilters !== null
      ) {
        // Already an object, use it directly
        filtersObj = parsedFilters;
      } else if (typeof parsedFilters === "string") {
        // String that might be JSON, try to parse it
        try {
          filtersObj = JSON.parse(parsedFilters);
          // Ensure it's an object after parsing
          if (typeof filtersObj !== "object" || Array.isArray(filtersObj)) {
            loggingService?.warn(
              `Parsed filters is not an object: ${typeof filtersObj}`,
              context || "filter-parsing"
            );
            filtersObj = {};
          }
        } catch (e) {
          loggingService?.error(
            `Failed to parse filters string: ${parsedFilters}`,
            context || "filter-parsing",
            e instanceof Error ? e.stack : undefined
          );
          filtersObj = {};
        }
      } else {
        // Other type (number, boolean, etc.), create empty object
        loggingService?.warn(
          `Unexpected filters type: ${typeof parsedFilters}, value: ${parsedFilters}`,
          context || "filter-parsing"
        );
        filtersObj = {};
      }
    }

    return filtersObj;
  }
}

