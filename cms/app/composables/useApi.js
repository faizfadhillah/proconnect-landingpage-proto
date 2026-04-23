import { $fetch } from "ofetch";
import { useAuthStore } from "~/stores/auth";
import { useSnackbarStore } from "~/stores/snackbar";

// In production builds, auto-imports may not work, so we import $fetch explicitly from ofetch
// Nuxt's $fetch is a wrapper around ofetch, so importing from ofetch directly works
export const useApi = () => {
  const config = useRuntimeConfig();
  let apiBase = config.public.apiBase;
  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const snackbar = useSnackbarStore();  

  const $apiFetch = async (url, options = {}) => {
    authStore.loadToken();
    const headers = options.headers || {};

    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    options.headers = headers;

    try {
      const fullUrl = `${apiBase}${url}`;
      // Log in production for debugging
      if (process.env.NODE_ENV === 'production') {
        console.log('[useApi] Making request to:', fullUrl);
      }
      // Use $fetch from ofetch (works in both dev and production)
      const response = await $fetch(fullUrl, options);
      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      if (
        error?.response?.status == 401 &&
        !["/login", "/signup"].includes(route.fullPath)
      ) {
        // Simpan current route ke localStorage sebelum redirect
        localStorage.setItem("redirectAfterLogin", route.fullPath);
        router.push("/check-auth");
      } else {
        const errorData = error.response?._data;
        let errorMessage = "Something went wrong!";

        if (errorData) {
          // Check for message field first (contains specific error like "Mapping already exists")
          // message can be string or array
          if (errorData.message) {
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join(", ");
            } else {
              errorMessage = errorData.message;
            }
          }
          // Fallback to error field (usually generic like "Bad Request")
          else if (errorData.error) {
            errorMessage =
              typeof errorData.error === "string"
                ? errorData.error
                : String(errorData.error);
          }
          // Fallback to stringified data
          else if (typeof errorData === "string") {
            errorMessage = errorData;
          }
        }

        snackbar.showSnackbar({
          message: errorMessage,
          color: "error",
        });
      }
      throw error;
    }
  };

  const $apiFetchRaw = async (url, options = {}) => {
    authStore.loadToken();
    const headers = options.headers || {};

    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    options.headers = headers;

    try {
      // Use $fetch.raw from ofetch (works in both dev and production)
      const response = await $fetch.raw(`${apiBase}${url}`, options);
      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      if (
        error.response.status == 401 &&
        !["/login", "/signup"].includes(route.fullPath)
      ) {
        localStorage.setItem("redirectAfterLogin", route.fullPath);
        router.push("/check-auth");
      } else {
        const errorData = error.response?._data;
        let errorMessage = "Something went wrong!";

        if (errorData) {
          // Check for message field first (contains specific error like "Mapping already exists")
          // message can be string or array
          if (errorData.message) {
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join(", ");
            } else {
              errorMessage = errorData.message;
            }
          }
          // Fallback to error field (usually generic like "Bad Request")
          else if (errorData.error) {
            errorMessage =
              typeof errorData.error === "string"
                ? errorData.error
                : String(errorData.error);
          }
          // Fallback to stringified data
          else if (typeof errorData === "string") {
            errorMessage = errorData;
          }
        }

        snackbar.showSnackbar({
          message: errorMessage,
          color: "error",
        });
      }
      throw error;
    }
  };

  return { $apiFetch, $apiFetchRaw };
};
