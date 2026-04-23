<template>
  <v-app class="bg-grey-lighten-4">
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center" class="fill-height">
          <v-col cols="12" sm="10" md="8" lg="6" xl="5">
            <v-card
              class="pa-8 text-center"
              rounded="xl"
              elevation="0"
              style="background: white"
            >
              <!-- 404 Icon -->
              <div class="mb-6">
                <v-icon size="120" color="primary" style="opacity: 0.8">
                  mdi-file-question-outline
                </v-icon>
              </div>

              <!-- Error Code -->
              <h1 class="text-primary font-weight-bold mb-2" style="font-size: 72px">
                404
              </h1>

              <!-- Error Message -->
              <h2 class="mb-4 text-grey-darken-1">
                Page Not Found
              </h2>

              <p class="text-grey-darken-1 mb-8">
                Sorry, the page you are looking for could not be found. 
                The page may have been moved, deleted, or the URL might be incorrect.
              </p>

              <!-- Action Buttons -->
              <div class="d-flex flex-column flex-sm-row gap-3 justify-center">
                <v-btn
                  variant="outlined"
                  color="primary"
                  size="large"
                  rounded="lg"
                  prepend-icon="mdi-arrow-left"
                  @click="goBack"
                >
                  Go Back
                </v-btn>
                <v-btn
                  color="primary"
                  size="large"
                  rounded="lg"
                  prepend-icon="mdi-home"
                  @click="goHome"
                >
                  Go to Home
                </v-btn>
              </div>

              <!-- Additional Help Text -->
              <v-divider class="my-6"></v-divider>
              <p class="text-caption text-grey">
                If you believe this is an error, please contact our support team.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
const router = useRouter();

// Navigation methods
const goHome = () => {
  router.push("/");
};

const goBack = () => {
  if (process.client && window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
};

// Set page meta
useHead({
  title: "404 - Page Not Found",
  meta: [
    {
      name: "description",
      content: "The page you are looking for could not be found.",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
