export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const router = useRouter();
    const authStore = useAuthStore();

    // Handle token from query parameter before navigation
    router.beforeEach((to, from, next) => {
      // Only process on initial load or when token is present
      if (to.query.token && typeof to.query.token === "string") {
        const tokenValue = to.query.token;

        // Save token to cookie and store immediately
        authStore.setToken(tokenValue);
        authStore.loadToken();

        // Double-check token is saved
        if (!authStore.token || authStore.token !== tokenValue) {
          authStore.setToken(tokenValue);
          authStore.loadToken();
        }

        if (authStore.token) {
          // Remove token from query and navigate to clean URL
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

          // Replace current route with clean URL (without token)
          next({
            path: to.path,
            query: Object.keys(newQuery).length > 0 ? newQuery : undefined,
            replace: true, // Use replace to avoid adding to history
          });
          return; // Stop further navigation
        }
      }

      // Continue normal navigation
      next();
    });
  }
});
