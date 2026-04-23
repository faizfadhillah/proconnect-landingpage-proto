import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  console.log("Auth middleware called:", {
    path: to.path,
    query: to.query,
    hasToken: !!to.query.token,
    isClient: process.client,
    tokenType: typeof to.query.token,
  });

  // Handle token from query parameter (from mobile app redirect)
  // This allows mobile app to redirect with token in URL and establish session
  if (process.client && to.query.token && typeof to.query.token === "string") {
    console.log("Processing token from query parameter");
    const tokenValue = to.query.token;

    // Save token to cookie (this also sets token in store state)
    authStore.setToken(tokenValue);
    // Immediately load token to ensure it's in store state for API calls
    authStore.loadToken();

    // Double-check: if token still not available, set it again
    // This handles edge case where cookie set might have timing issues
    if (!authStore.token || authStore.token !== tokenValue) {
      console.warn("Token not loaded correctly, retrying...");
      authStore.setToken(tokenValue);
      authStore.loadToken();
    }

    // Verify token is available before continuing
    if (authStore.token) {
      console.log("Auth middleware - token from query saved successfully");

      // Remove token from URL for security (prevent token exposure in URL)
      // Use setTimeout to ensure cookie is saved and then update URL
      // Using window.history.replaceState to avoid triggering middleware again
      setTimeout(() => {
        const newQuery: Record<string, string> = {};
        Object.keys(to.query).forEach((key) => {
          if (key !== "token") {
            const value = to.query[key];
            if (typeof value === "string") {
              newQuery[key] = value;
            } else if (Array.isArray(value) && value.length > 0) {
              newQuery[key] = String(value[0]);
            }
          }
        });
        const queryString =
          Object.keys(newQuery).length > 0
            ? "?" + new URLSearchParams(newQuery).toString()
            : "";
        window.history.replaceState(
          {},
          "",
          window.location.pathname + queryString
        );
      }, 0);
    } else {
      console.error(
        "Auth middleware - Failed to save token from query parameter"
      );
    }

    // Don't return early - let normal flow continue
    // Token is already in store, so check below will pass
  } else {
    // Normal flow: Load token from cookie
    authStore.loadToken();
  }

  const currentToken = authStore.token;
  const tokenInfo = currentToken
    ? `exists (length: ${(currentToken as string).length})`
    : "missing";
  console.log("Auth middleware - token:", tokenInfo);

  if (!authStore.token && to.name !== "login") {
    return navigateTo("/login");
  }
});
