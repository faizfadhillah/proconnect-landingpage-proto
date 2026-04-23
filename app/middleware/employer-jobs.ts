import { useUser } from "~/composables/useUser";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Check if route is under /admin/jobs/employer
  if (!to.path.startsWith("/admin/jobs/employer")) {
    return;
  }

  const { me, fetchMe } = useUser();

  // Fetch user data if not already loaded
  if (!me.value.id) {
    try {
      await fetchMe();
    } catch (error) {
      // If fetch fails, let auth middleware handle it
      return;
    }
  }

  // Check if user is candidate
  if (me.value.user_role === "candidate") {
    throw createError({
      statusCode: 403,
      statusMessage: "Access Denied",
      message: "You do not have permission to access this page.",
    });
  }
});
