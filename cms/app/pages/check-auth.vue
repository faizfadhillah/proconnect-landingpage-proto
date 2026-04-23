<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <div class="mt-4 text-body-1">Checking Authentication Status...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const { initialize } = useFirebaseAuth();
const router = useRouter();
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();

const checkAuth = async () => {
  try {
    // Tunggu inisialisasi Firebase dan dapatkan current user
    const firebaseUser = await initialize();

    if (firebaseUser) {
      // Refresh token untuk mendapatkan token baru
      const authStore = useAuthStore();
      const newToken = await firebaseUser.getIdToken(true); // force refresh token
      authStore.setToken(newToken);

      try {
        // Coba hit API untuk memvalidasi token baru
        await fetchMe();
        if (!me.value.user_role) {
          router.push("/admin/profile/choose-role");
        } else {
          const redirectPath = localStorage.getItem("redirectAfterLogin");
          if (redirectPath && !["/check-auth", "/login"].includes(redirectPath)) {
            localStorage.removeItem("redirectAfterLogin");
            router.push(redirectPath);
          } else {
            router.back();
          }
        }
      } catch (error) {
        console.error("API validation failed:", error);
        router.push("/login");
      }
    } else {
      // Tidak ada user yang login
      console.log("No authenticated user found");
      router.push("/login");
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    router.push("/login");
  }
};

// Jalankan pengecekan saat halaman dimuat
onMounted(() => {
  setTimeout(() => {
    checkAuth();
  }, 1000);
});
</script>
