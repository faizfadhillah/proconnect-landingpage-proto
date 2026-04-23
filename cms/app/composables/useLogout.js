export const useLogout = () => {
  const router = useRouter();
  const { me } = useUser();
  const { signOutUser } = useFirebaseAuth();
  const loading = ref(false);
  const errorMessage = ref("");

  const handleLogout = async () => {
    loading.value = true;
    errorMessage.value = "";

    try {
      // Remove redirect after login
      localStorage.removeItem("redirectAfterLogin");

      // Sign out from Firebase
      const result = await signOutUser();

      // Check if there's an error from signOutUser
      if (result && result.error) {
        errorMessage.value = result.error;
        return;
      }

      // Reset user state
      if (me.value) {
        me.value.id = null;
      }

      // Redirect to login
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      errorMessage.value = "Failed to logout. Please try again.";
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    handleLogout,
    loading,
    errorMessage,
  };
};
