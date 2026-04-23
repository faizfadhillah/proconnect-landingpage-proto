<script setup>
const email = useState("emailSignin", () => "");
const password = useState("passwordSignin", () => "");
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

const me = useState("me", () => {
  return {
    id: null,
    menus: [],
  };
});

const snackbar = useSnackbarStore();

const signInWithCredential = async () => {
  submitLoading.value = true;
  emailErrors.value = [];
  passwordErrors.value = [];
  const { user, message, error } = await signinUser(
    email.value,
    password.value
  );

  if (error) {
    passwordErrors.value.push(error);
    submitLoading.value = false;
    return;
  }
  me.value = { id: null };

  $apiFetch("/users/me")
    .then((data) => {
      //setTimeout(() => {
        Object.assign(me.value, data);
      //}, 100);
      isAuthenticating.value = false;
      if (data) {
        loginSuccessAction();
      }
    })
    .catch(async (error) => {
      isAuthenticating.value = false;
      if (
        error.response &&
        error.response._data &&
        error.response._data.message
      ) {
        const errorMessages = error.response._data.message;
        errorMessages.forEach((errMsg) => {
          if (errMsg.includes("email")) {
            providerErrors.value.push(errMsg);
          } else if (errMsg.includes("credentials")) {
            providerErrors.value.push(errMsg);
          } else if (errorMessages.includes("Access denied.")) {
            snackbar.showSnackbar({
              message:
                "Access denied. Your account role has been deactivated. Please contact the administrator for further assistance.",
              color: "error",
            });
          } else {
            snackbar.showSnackbar({
              message: errorMessages,
              color: "error",
            });
          }
        });
      }
    })
    .finally(() => {
      submitLoading.value = false;
    });
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
  me.value = { id: null };
  $apiFetch("/users/me")
    .then((data) => {
      setTimeout(() => {
        Object.assign(me.value, data);
      }, 100);
      isAuthenticating.value = false;
      if (data) {
        loginSuccessAction();
      }
    })
    .catch(async (error) => {
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
            } else if (errorMessages.includes("Access denied.")) {
              snackbar.showSnackbar({
                message:
                  "Access denied. Your account role has been deactivated. Please contact the administrator for further assistance.",
                color: "error",
              });
            } else {
              snackbar.showSnackbar({
                message: errorMessages,
                color: "error",
              });
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
      $apiFetch(`/firebase/orphan-user/${user.uid}`, {
        method: "DELETE",
      });
      authStore.clearToken();
    });
};

const loginSuccessAction = () => {
  // Di auth store atau halaman login setelah login berhasil
  const redirectPath = localStorage.getItem("redirectAfterLogin");
  if (redirectPath && !["/check-auth", "/login"].includes(redirectPath)) {
    localStorage.removeItem("redirectAfterLogin");
    router.push(redirectPath);
  } else {
    router.push("/admin/dashboard"); // default redirect
  }
};

onMounted(async () => {
  //await signOutUser();
});
</script>
<template>
  <v-app style="width: 100%">
    <div>
      <v-container
        fluid
        class="fill-height d-flex justify-center align-center"
        style="
          background: url('/images/bg2.jpg') no-repeat center center;
          background-size: cover;
          width: 100%;
          min-height: 100vh;
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
            class="mb-5"
            rounded="lg"
            style="
              background: rgba(255, 255, 255, 0.8);
              backdrop-filter: blur(3px);
              -webkit-backdrop-filter: blur(10px);
              width: 100%;
            "
            to="/"
          >
            <v-card-text class="text-center">
              Return to Main Website
              <v-icon class="ml-2" color="primary">mdi-arrow-right</v-icon>
            </v-card-text>
          </v-card>
          <v-card
            theme="dark"
            class="pa-2"
            rounded="xl"
            outlined
            style="
              background: rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              width: 100%;
            "
          >
            <v-card-text class="text-center py-0">
              <v-img src="/logo-white.svg" contain height="116"></v-img>
            </v-card-text>
            <v-card-text>
              <h2 class="mb-1">Sign In</h2>
              <p class="text-caption mb-3" style="font-size: 12px">
                Please Sign in to your account to continue
              </p>
              <form @submit.prevent="signInWithCredential()">
                <v-text-field
                  label="Email"
                  prepend-inner-icon="mdi-account"
                  required
                  v-model="email"
                  :error-messages="emailErrors"
                  density="comfortable"
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
                  density="comfortable"
                ></v-text-field>
                <v-btn
                  type="submit"
                  :loading="submitLoading"
                  color="blue-darken-3"
                  block
                  class="mb-4"
                  rounded="lg"
                  height="40"
                  >SIGN IN</v-btn
                >
                <div class="text-center mb-4">Or sign in via:</div>
                <v-row>
                  <v-col cols="12">
                    <v-card
                      @click="providerSignin('google')"
                      :loading="isAuthenticating"
                      rounded="lg"
                      theme="light"
                    >
                      <center>
                        <v-img
                          src="/google-btn.svg"
                          cover
                          style="width: 130px !important"
                        >
                        </v-img>
                      </center>
                    </v-card>
                  </v-col>
                  <v-col cols="6" style="display: none">
                    <v-card @click="providerSignin('apple')" rounded="lg">
                      <center>
                        <v-img
                          src="/apple-btn.svg"
                          cover
                          style="width: 130px !important"
                        ></v-img>
                      </center>
                    </v-card>
                  </v-col>
                  <v-col cols="12" v-if="providerErrors.length">
                    <v-alert density="compact" type="warning">{{
                      providerErrors
                    }}</v-alert>
                  </v-col>
                </v-row>
              </form>
            </v-card-text>
            <v-card-text class="pt-0">
              <p class="text-center" style="font-size: 12px">
                By continuing sign in, you agree to ProConnect
                <router-link to="/term-of-service?back=true"
                  >Term of Service</router-link
                >
                and acknowledge our
                <router-link to="/privacy-policy?back=true"
                  >Privacy Policy</router-link
                >.
              </p>
            </v-card-text>
            <v-card-text class="pl-0 pt-0 pb-0">
              <v-btn
                variant="text"
                color="primary"
                class="mr-4"
                to="/forgot-password"
                >Forgot Password?</v-btn
              ><br />
              <v-btn to="/signup" variant="text" color="primary"
                >Create an Account</v-btn
              >
            </v-card-text>
          </v-card>
        </v-col>
      </v-container>
    </div>
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
