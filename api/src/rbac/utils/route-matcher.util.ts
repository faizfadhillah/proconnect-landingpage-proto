/**
 * Utility functions for matching routes with RBAC route definitions
 */

interface Route {
  name: string;
  method: string;
}

/**
 * Check if a request path and method matches a route definition
 * @param routePath - The route path from RBAC (e.g., '/jobs/:id')
 * @param requestPath - The actual request path (e.g., '/jobs/123')
 * @param routeMethod - The route method from RBAC (e.g., 'GET', 'ALL')
 * @param requestMethod - The actual HTTP method (e.g., 'GET', 'POST')
 * @returns true if the route matches
 */
export function checkRouteMatch(
  routePath: string,
  requestPath: string,
  routeMethod: string,
  requestMethod: string,
): boolean {
  // 1. Exact match first (most precise)
  if (routePath === requestPath) {
    return routeMethod === "ALL" || routeMethod === requestMethod;
  }

  // 2. Parameter matching (only :param format)
  // Convert route path to regex pattern
  // Strategy: Replace params first, then escape remaining special chars
  // Use placeholder that won't be affected by regex escaping
  const PARAM_PLACEHOLDER = "___PARAM___";
  const WILDCARD_PLACEHOLDER = "___WILD___";
  
  const pattern = routePath
    // Replace parameter placeholders with safe placeholders (before escaping)
    .replace(/:[^/]+/g, PARAM_PLACEHOLDER) // :param
    .replace(/\*/g, WILDCARD_PLACEHOLDER) // *
    // Escape all special regex characters (placeholders are safe - only contain _)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Restore placeholders as actual regex patterns
    .replace(new RegExp(PARAM_PLACEHOLDER, "g"), "[^/]+")
    .replace(new RegExp(WILDCARD_PLACEHOLDER, "g"), ".*");
  
  const pathRegex = new RegExp(`^${pattern}$`);
  const pathMatches = pathRegex.test(requestPath);
  
  // Only check method if path matches
  if (pathMatches) {
    return routeMethod === "ALL" || routeMethod === requestMethod;
  }

  // 3. Wildcard fallback (only if route ends with /*)
  if (routePath.endsWith("/*")) {
    const prefix = routePath.slice(0, -2); // remove /* from the end
    if (requestPath === prefix || requestPath.startsWith(prefix + "/")) {
      return routeMethod === "ALL" || routeMethod === requestMethod;
    }
  }

  return false;
}

/**
 * Check if a request path and method is allowed based on allowed routes
 * @param allowedRoutes - Array of allowed routes
 * @param requestPath - The actual request path
 * @param requestMethod - The actual HTTP method
 * @returns true if the request is allowed
 */
export function isRouteAllowed(
  allowedRoutes: Route[],
  requestPath: string,
  requestMethod: string,
): boolean {
  return allowedRoutes.some((route) =>
    checkRouteMatch(route.name, requestPath, route.method, requestMethod),
  );
}

