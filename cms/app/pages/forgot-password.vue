<script setup>
const email = ref();
const emailErrors = ref([]);
const providerErrors = ref([]);
const submitLoading = ref(false);

const isAuthenticating = useState("isAuthenticating", () => false);
const authStore = useAuthStore();
const { $apiFetch } = useApi();
const router = useRouter();
const isSuccessMessage = ref("");

//google dan apple
const forgotPassword = async () => {
  isSuccessMessage.value = "";
  isAuthenticating.value = true;
  submitLoading.value = true;
  try {
    const data = await $apiFetch("/users/forgot-password", {
      method: "POST",
      body: {
        email: email.value,
      },
    });
    isSuccessMessage.value = data.message;
    isAuthenticating.value = false;
    submitLoading.value = false;
  } catch (error) {
    isAuthenticating.value = false;
    console.error("Error during login:", error);
    submitLoading.value = false;
    if (
      error.response &&
      error.response._data &&
      error.response._data.message
    ) {
      const errorMessages = error.response._data.message;
      if (Array.isArray(errorMessages)) {
        errorMessages.forEach((errMsg) => {
          if (errMsg.includes("email")) {
            providerErrors.value.push(errMsg);
          } else if (errMsg.includes("credentials")) {
            providerErrors.value.push(errMsg);
          }
        });
      } else {
        providerErrors.value.push(errorMessages);
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
    }
    await authStore.clearToken();
  }
};

onMounted(async () => {});
</script>
<template>
  <v-app>
    <v-container
      fluid
      class="fill-height d-flex justify-center align-center"
      style="
        background: url('/images/bg2.jpg') no-repeat center center;
        background-size: cover;
      "
    >
      <v-col
        cols="12"
        sm="6"
        md="4"
        lg="3"
        offset-lg="8"
        offset-md="6"
        offset-sm="6"
        class="d-flex flex-column align-center pa-0"
      >
        <v-card
          theme="dark"
          class="pa-5"
          rounded="xl"
          outlined
          style="
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            width: 100%;
          "
        >
          <v-card-text class="text-center pb-0">
            <v-img src="/logo-white.svg" contain height="106"></v-img>
          </v-card-text>
          <v-card-text>
            <h2>Forgot Password</h2>
            <p>
              Enter your email and we'll send you a link to reset your password
            </p>
          </v-card-text>
          <v-card-text>
            <form @submit.prevent="forgotPassword()">
              <v-text-field
                label="Email"
                prepend-inner-icon="mdi-account"
                required
                v-model="email"
                :error-messages="emailErrors"
              ></v-text-field>

              <v-btn
                type="submit"
                :loading="submitLoading"
                :disabled="isSuccessMessage ? true : false"
                color="blue-darken-3"
                block
                rounded="lg"
                height="40"
                >Forgot Password</v-btn
              >
            </form>
          </v-card-text>
          <v-card-text v-if="isSuccessMessage">
            <v-alert type="success"
              >{{ isSuccessMessage }}, please check your email.</v-alert
            >
          </v-card-text>
          <v-card-text>
            Remember your password ?
            <router-link
              to="/login"
              class="text-primary"
              style="text-decoration: none"
              >Login Here</router-link
            >
          </v-card-text>
          <v-card-actions>
            <v-btn to="/submit-feedback" variant="text" color="primary"
              >Submit a Feedback</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-container>
  </v-app>
</template>

<script>
export default {
  name: "LoginScreen",
};
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}
.fill-height {
  height: 100%;
}
</style>
