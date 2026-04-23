<script setup>
const email = useState("emailSignin", () => "superadmin@mail.com");
const password = useState("passwordSignin", () => "!Super@dmin$ecurePa$$word");
const emailErrors = ref([]);
const passwordErrors = ref([]);
const providerErrors = ref([]);
const showPassword = ref(false);
const submitLoading = ref(false);

const { signinUser, signinWith, signOutUser } = useFirebaseAuth();

const isAuthenticating = useState("isAuthenticating", () => false);
const authStore = useAuthStore();
const { $apiFetch } = useApi();
const router = useRouter();
const { me, fetchMe } = useUser();

const signInWithCredential = async () => {
  submitLoading.value = true;
  emailErrors.value = [];
  passwordErrors.value = [];
  const { user, message, error } = await signinUser(
    email.value,
    password.value
  );
  submitLoading.value = false;
  if (error) {
    passwordErrors.value.push(error);
    return;
  }
  authStore.setToken(user.accessToken);
  router.push("/admin/dashboard");
};

//google dan apple
const providerSignin = async (providerType) => {
  providerErrors.value = [];
  isAuthenticating.value = true;
  const { user, message, error } = await signinWith(providerType);
  if (error) {
    providerErrors.value.push(error);
    isAuthenticating.value = false;
    return;
  }
  authStore.setToken(user.accessToken);

  try {
    await fetchMe();
    router.push("/admin/dashboard");
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

onMounted(async () => {
  await signOutUser();
});
</script>
<template>
  <v-app>
    <v-container
      fluid
      class="fill-height d-flex justify-center align-center"
      style="
        background: url('bg-login.webp') no-repeat center center;
        background-size: cover;
      "
    >
      <v-row>
        <v-col
          cols="12"
          sm="8"
          md="6"
          lg="4"
          offset-lg="8"
          offset-sm="6"
          class="d-flex flex-column align-center"
        >
          <v-card class="pa-5" outlined>
            <v-card-subtitle class="text-center">
              <v-img src="/logo.svg" contain height="60"></v-img>
              <h1>ASEAN PROCONNECT</h1>
              <p>Powered by ASEANTA</p>
            </v-card-subtitle>
            <v-card-text>
              <form @submit.prevent="signInWithCredential()">
                <v-text-field
                  label="Email"
                  prepend-inner-icon="mdi-account"
                  required
                  v-model="email"
                  :error-messages="emailErrors"
                ></v-text-field>
                <v-text-field
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock"
                  append-inner-icon="mdi-eye"
                  @click:append-inner="showPassword = !showPassword"
                  v-model="password"
                  required
                  :error-messages="passwordErrors"
                ></v-text-field>
                <v-btn
                  type="submit"
                  :loading="submitLoading"
                  color="red"
                  block
                  class="mb-4"
                  >Sign In</v-btn
                >
                <div class="text-center mb-4">Or sign in via:</div>
                <v-row>
                  <v-col cols="6">
                    <v-card
                      @click="providerSignin('google')"
                      :loading="isAuthenticating"
                    >
                      <v-img src="/google-btn.svg" contain height="40"></v-img>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card @click="providerSignin('apple')">
                      <v-img src="/apple-btn.svg" contain height="40"></v-img>
                    </v-card>
                  </v-col>
                  <v-col cols="12" v-if="providerErrors.length">
                    <v-alert density="compact" type="warning"
                      >{{ providerErrors }} Please
                      <router-link to="/signup">Sign Up</router-link>
                      first.</v-alert
                    >
                  </v-col>
                </v-row>
              </form>
            </v-card-text>
            <v-card-text class="pl-0">
              <v-btn variant="text" color="red" class="mr-4"
                >Forgot Password?</v-btn
              ><br />
              <v-btn to="/signup" variant="text" color="red"
                >Create an Account</v-btn
              >
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
