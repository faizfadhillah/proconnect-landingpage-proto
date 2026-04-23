<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12" md="8" lg="6" class="mx-auto">
          <v-card rounded="lg" elevation="0">
            <v-card-title class="font-weight-bold text-center py-4">
              Confirm Sign Out
            </v-card-title>
            <v-card-text>
              <p class="mb-4 text-center">
                Are you sure you want to sign out from your account?
              </p>

              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <div class="d-flex justify-center gap-4">
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="handleLogout"
                  :loading="loading"
                  rounded="lg"
                  height="48"
                  min-width="120"
                  class="mr-2"
                >
                  Yes, Sign Out
                </v-btn>

                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="goBack"
                  rounded="lg"
                  height="48"
                  min-width="120"
                >
                  Cancel
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

const { handleLogout, loading, errorMessage } = useLogout();
const router = useRouter();

const goBack = () => {
  router.back();
};
</script>
