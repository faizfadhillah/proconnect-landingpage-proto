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
              <!-- Error Icon -->
              <div class="mb-6">
                <v-icon size="120" color="primary" style="opacity: 0.8">
                  {{ errorIcon }}
                </v-icon>
              </div>

              <!-- Error Code -->
              <h1
                class="font-weight-bold mb-2"
                :class="statusCode === 404 ? 'text-primary' : 'text-error'"
              >
                {{ statusCode || "Error" }}
              </h1>

              <!-- Error Message -->
              <h2 class="mb-4 text-grey-darken-1">
                {{ errorTitle }}
              </h2>

              <p class="text-grey-darken-1 mb-8">
                {{ errorMessage }}
              </p>

              <!-- Action Buttons -->
              <div class="d-flex flex-column flex-sm-row gap-3 justify-center">
                <v-btn
                  variant="outlined"
                  color="primary"
                  size="large"
                  rounded="lg"
                  prepend-icon="mdi-arrow-left"
                  class="mb-3"
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
                If this problem persists, please contact our support team.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    default: null,
  },
});

const router = useRouter();
const route = useRoute();

// Get status code from error or default to 404
const statusCode = computed(() => {
  return props.error?.statusCode || props.error?.status || 404;
});

// Determine error icon based on status code
const errorIcon = computed(() => {
  switch (statusCode.value) {
    case 404:
      return "mdi-file-question-outline";
    case 403:
      return "mdi-lock-alert-outline";
    case 500:
      return "mdi-server-off";
    default:
      return "mdi-alert-circle-outline";
  }
});

// Error title based on status code
const errorTitle = computed(() => {
  switch (statusCode.value) {
    case 404:
      return "Page Not Found";
    case 403:
      return "Access Denied";
    case 500:
      return "Server Error";
    case 503:
      return "Service Unavailable";
    default:
      return "An Error Occurred";
  }
});

// Error message based on status code
const errorMessage = computed(() => {
  switch (statusCode.value) {
    case 404:
      return "Sorry, the page you are looking for could not be found. The page may have been moved or deleted.";
    case 403:
      return "You do not have permission to access this page.";
    case 500:
      return "A server error occurred. Our team has been notified and is working to fix it.";
    case 503:
      return "The service is currently under maintenance. Please try again later.";
    default:
      return (
        props.error?.message ||
        "An unexpected error occurred. Please try again."
      );
  }
});

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
  title: `${statusCode.value} - ${errorTitle.value}`,
  meta: [
    {
      name: "description",
      content: errorMessage.value,
    },
    ...(statusCode.value === 404 ? [
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ] : []),
  ],
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
