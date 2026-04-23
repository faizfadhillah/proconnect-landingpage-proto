<script setup>
const email = useState("emailSignup", () => "");
const phoneNumber = useState("phoneNumberSignup", () => "");
const phone = useState("phoneSignup", () => "");
const password = useState("passwordSignup", () => "");
const firebaseUid = useState("firebaseUid", () => "");
const passwordConfirm = useState("passwordSignupConfirm", () => "");
const emailErrors = ref([]);
const phoneErrors = ref([]);
const passwordErrors = ref([]);
const passwordConfirmErrors = ref([]);
const providerErrors = ref([]);
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const submitLoading = ref(false);

const { registerUser, signinUser, signinWith, signOutUser } = useFirebaseAuth();
const isAuthenticating = useState("isAuthenticating", () => false);
const authStore = useAuthStore();
const { $apiFetch } = useApi();
const router = useRouter();

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const countryCodes = [
  { name: "Indonesia", dial_code: "+62", code: "ID", flag: "🇮🇩" },
  { name: "Malaysia", dial_code: "+60", code: "MY", flag: "🇲🇾" },
  { name: "Singapore", dial_code: "+65", code: "SG", flag: "🇸🇬" },
  { name: "Thailand", dial_code: "+66", code: "TH", flag: "🇹🇭" },
  { name: "Vietnam", dial_code: "+84", code: "VN", flag: "🇻🇳" },
  { name: "Philippines", dial_code: "+63", code: "PH", flag: "🇵🇭" },
  { name: "Brunei", dial_code: "+673", code: "BN", flag: "🇧🇳" },
  { name: "Cambodia", dial_code: "+855", code: "KH", flag: "🇰🇭" },
  { name: "Laos", dial_code: "+856", code: "LA", flag: "🇱🇦" },
  { name: "Myanmar", dial_code: "+95", code: "MM", flag: "🇲🇲" },
  // Add more country codes as needed
];
const selectedCountryCode = ref(countryCodes[0]);
watch(
  [() => phoneNumber.value, selectedCountryCode],
  ([newPhone, newCountryCode]) => {
    if (newPhone && !newPhone.startsWith("+")) {
      console.log(newCountryCode);
      phone.value = `${newCountryCode.dial_code} ${newPhone}`;
    }
  },
  { deep: true }
);

const me = useState("me", () => {
  return {
    id: null,
    menus: [],
  };
});

const validatePhone = (phone) => {
  const re = /^(\+?\d{1,2}\s?)?\d{10,12}$/; // Allow optional space after country code
  return re.test(String(phone));
};

const form = ref(null);
const validateForm = async () => {
  let isValid = true;
  emailErrors.value = [];
  phoneErrors.value = [];
  passwordErrors.value = [];
  passwordConfirmErrors.value = [];

  if (!validateEmail(email.value)) {
    emailErrors.value.push("Invalid email format.");
    isValid = false;
  }

  if (!validatePhone(phone.value)) {
    phoneErrors.value.push("Invalid phone number format.");
    isValid = false;
  }

  if (password.value !== passwordConfirm.value) {
    passwordConfirmErrors.value.push("Passwords do not match.");
    isValid = false;
  }

  return isValid;
};

const signInWithCredential = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    return;
  }

  const isValid = await validateForm();
  if (!isValid) {
    return;
  }

  submitLoading.value = true;

  const savedEndTime = localStorage.getItem("countdownEndTime");
  const savedEmail = localStorage.getItem("countdownEmail");

  localStorage.setItem("countdownEmail", email.value);
  localStorage.setItem("countdownPhone", phone.value);
  localStorage.setItem("countdownPassword", password.value);

  if (savedEndTime && savedEmail == email.value) {
    router.push({
      path: "/signup-verify-otp",
    });
    return;
  }

  try {
    const data = await $apiFetch("/users/public-request-otp", {
      method: "POST",
      body: {
        email: email.value,
      },
    });
    submitLoading.value = false;
    localStorage.removeItem("countdownEndTime");
    router.push({
      path: "/signup-verify-otp",
    });
  } catch (error) {
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
            emailErrors.value.push(errMsg);
          } else if (errMsg.includes("credentials")) {
            passwordErrors.value.push(errMsg);
          }
        });
      } else {
        if (errorMessages.includes("email")) {
          emailErrors.value.push(errorMessages);
        } else {
          passwordErrors.value.push(errorMessages);
        }
      }
    } else {
      emailErrors.value.push("An unexpected error occurred. Please try again.");
    }
  }

  submitLoading.value = false;
};

const providerSignin = async (providerType) => {
  isAuthenticating.value = true;
  providerErrors.value = [];
  const { user, message, error } = await signinWith(providerType);
  if (error) {
    isAuthenticating.value = false;
    providerErrors.value.push(error);
    return;
  }

  try {
    const data = await $apiFetch("/users", {
      method: "POST",
      body: {
        email: user.email,
        phone: user.phoneNumber,
        firebase_uid: user.uid,
        photo_url: user.photoURL,
      },
    });
    isAuthenticating.value = false;
    authStore.setToken(user.accessToken);
    router.push("/admin/dashboard");
  } catch (error) {
    isAuthenticating.value = false;
    console.error("Error during login:", error);
    submitLoading.value = false;
    
    let isUserAlreadyExists = false;
    if (
      error.response &&
      error.response._data &&
      error.response._data.message
    ) {
      const errorMessages = error.response._data.message;
      if (Array.isArray(errorMessages)) {
        errorMessages.forEach((errMsg) => {
          // Check if error indicates user already exists
          if (errMsg.includes("already exist") || errMsg.includes("already exists")) {
            isUserAlreadyExists = true;
          }
          if (errMsg.includes("email")) {
            providerErrors.value.push(errMsg);
          } else if (errMsg.includes("credentials")) {
            providerErrors.value.push(errMsg);
          }
        });
      } else {
        // Check if error indicates user already exists
        if (errorMessages.includes("already exist") || errorMessages.includes("already exists")) {
          isUserAlreadyExists = true;
        }
        providerErrors.value.push(errorMessages);
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
    }
    
    // Only delete Firebase account if user is truly orphan (not registered in database)
    // Don't delete if user already exists - they should login instead
    if (!isUserAlreadyExists) {
      $apiFetch(`/firebase/orphan-user/${user.uid}`, {
        method: "DELETE",
      });
    } else {
      // User already exists, suggest them to login
      providerErrors.value.push("User already exists. Please login instead.");
    }
    authStore.clearToken();
  }
};

onMounted(async () => {
  me.value = { id: null };
  await signOutUser();
});
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
          class="pa-3"
          rounded="xl"
          outlined
          style="
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            width: 100%;
          "
        >
          <v-card-text class="text-center pb-0 pt-0">
            <v-img src="/logo-white.svg" contain height="106"></v-img>
          </v-card-text>
          <v-card-text>
            <h2 class="mb-1">Sign Up</h2>
            <p class="text-caption mb-3" style="font-size: 12px">
              Please register your account to continue
            </p>
            <v-form ref="form" @submit.prevent="signInWithCredential">
              <v-text-field
                label="Email"
                prepend-inner-icon="mdi-account"
                required
                v-model="email"
                type="email"
                density="comfortable"
                :rules="[
                  (v) => !!v || 'Email is required',
                  (v) => validateEmail(v) || 'Invalid email format',
                ]"
                :error-messages="emailErrors"
              ></v-text-field>

              <!-- Komponen phone field yang baru -->
              <v-phone-field
                v-model="phone"
                :phone-number="phoneNumber"
                @update:phone-number="phoneNumber = $event"
                :error-messages="phoneErrors"
                default-country="ID"
                :rules="[
                  (v) => !!v || 'Phone number is required',
                  (v) => /^[0-9]{1,}$/.test(v) || 'Phone must be numbers only',
                ]"
                isSignup="true"
              />

              <v-text-field
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                append-inner-icon="mdi-eye"
                @click:append-inner="showPassword = !showPassword"
                v-model="password"
                required
                density="comfortable"
                :rules="[
                  (v) => !!v || 'Password is required',
                  (v) =>
                    v.length >= 8 || 'Password must be at least 8 characters',
                  (v) =>
                    /[A-Z]/.test(v) ||
                    'Password must contain at least one uppercase letter',
                  (v) =>
                    /[0-9]/.test(v) ||
                    'Password must contain at least one number',
                  (v) =>
                    /[!@#$%^&*(),.?\:{}|<>]/.test(v) ||
                    'Password must contain at least one symbol',
                ]"
                :error-messages="passwordErrors"
              ></v-text-field>
              <v-text-field
                label="Password Confirmation"
                :type="showPasswordConfirm ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                append-inner-icon="mdi-eye"
                @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
                v-model="passwordConfirm"
                required
                density="comfortable"
                :rules="[
                  (v) => !!v || 'Password confirmation is required',
                  (v) => v === password || 'Passwords must match',
                ]"
                :error-messages="passwordConfirmErrors"
              ></v-text-field>
              <v-btn
                type="submit"
                :loading="submitLoading"
                color="blue-darken-3"
                block
                class="mb-4"
                height="40"
                rounded="lg"
                >SIGN UP</v-btn
              >
              <div class="text-center mb-4">Or sign up via:</div>
              <v-row>
                <v-col cols="12">
                  <v-card
                    theme="light"
                    @click="providerSignin('google')"
                    :loading="isAuthenticating"
                    rounded="lg"
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
                  <v-alert density="compact" type="warning"
                    >{{ providerErrors }}. please login
                    <router-link to="/login">login</router-link></v-alert
                  >
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-text class="pt-0">
            <p class="text-center" style="font-size: 12px">
              By continuing sign up, you agree to ProConnect
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
            <v-btn to="/login" variant="text" color="primary"
              >Already have an account?</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>
    </v-container>
  </v-app>
</template>

<style scoped>
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
