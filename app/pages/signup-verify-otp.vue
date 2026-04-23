<script setup>
const email = useState("emailSignup", () => "");
const phone = useState("phoneSignup", () => "");
const password = useState("passwordSignup", () => "");
const otp = ref();
const passwordConfirm = useState("passwordSignupConfirm", () => "");
const emailErrors = ref([]);
const phoneErrors = ref([]);
const passwordErrors = ref([]);
const otpErrors = ref([]);
const passwordConfirmErrors = ref([]);
const providerErrors = ref([]);
const showPassword = ref(false);
const showPasswordConfirm = ref(false);
const submitLoading = ref(false);
const countdown = ref(0); // 5 menit dalam detik
const canResend = ref(false); // Status apakah tautan "Resend Code" bisa diklik
let countdownTimer = null;
const termsAccepted = ref(false);
const privacyAccepted = ref(false);

const { registerUser, signinUser, signinWith, signOutUser } = useFirebaseAuth();
const isAuthenticating = useState("isAuthenticating", () => false);
const authStore = useAuthStore();
const { $apiFetch } = useApi();
const router = useRouter();
const route = useRoute();

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone) => {
  const re = /^(\+?\d{1,2})?\d{10,12}$/; // Adjust the regex based on the desired phone number format
  return re.test(String(phone));
};

const validateForm = () => {
  let isValid = true;
  emailErrors.value = [];
  phoneErrors.value = [];
  passwordErrors.value = [];
  passwordConfirmErrors.value = [];
  otpErrors.value = [];

  if (!validateEmail(email.value)) {
    emailErrors.value.push("Invalid email format.");
    isValid = false;
  }

  if (password.value !== passwordConfirm.value) {
    passwordConfirmErrors.value.push("Passwords do not match.");
    isValid = false;
  }

  return isValid;
};

const signInWithCredential = async () => {
  if (!validateForm()) {
    return;
  }

  submitLoading.value = true;

  try {
    const { user, message, error } = await registerUser(
      email.value,
      password.value
    );
    if (error) {
      submitLoading.value = false;
      otpErrors.value.push(error);
      return;
    }

    if (user) {
      console.log(user);
      const data = await $apiFetch("/users", {
        method: "POST",
        body: {
          email: user.email,
          phone: phone.value,
          firebase_uid: user.uid,
          otp: otp.value,
        },
      });
      console.log(data);
      authStore.setToken(user.accessToken);
      localStorage.removeItem("countdownEndTime");
      localStorage.removeItem("countdownEmail");
      localStorage.removeItem("countdownPhone");
      localStorage.removeItem("countdownPassword");
      router.push("/admin/dashboard");
    }
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
            otpErrors.value.push(errMsg);
          } else if (errMsg.includes("credentials")) {
            otpErrors.value.push(errMsg);
          }
        });
      } else {
        otpErrors.value.push(errorMessages);
      }
    } else {
      otpErrors.value.push("An unexpected error occurred. Please try again.");
    }
  }

  submitLoading.value = false;
};

const resendCode = async () => {
  if (!canResend.value) {
    return;
  }
  otpErrors.value = [];
  submitLoading.value = true;

  try {
    const data = await $apiFetch("/users/public-request-otp", {
      method: "POST",
      body: {
        email: email.value,
      },
    });
    submitLoading.value = false;
    resetCountdown();
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
            otpErrors.value.push(errMsg);
          } else if (errMsg.includes("credentials")) {
            otpErrors.value.push(errMsg);
          }
        });
      } else {
        otpErrors.value.push(errorMessages);
      }
    } else {
      otpErrors.value.push("An unexpected error occurred. Please try again.");
    }
  }

  submitLoading.value = false;
};

const startCountdown = () => {
  const savedEndTime = localStorage.getItem("countdownEndTime");
  const now = Date.now();
  if (savedEndTime !== undefined && savedEndTime !== null) {
    const remainingTime = Math.max(
      0,
      Math.floor((parseInt(savedEndTime) - now) / 1000)
    );
    if (remainingTime > 0) {
      countdown.value = remainingTime;
    }
  } else {
    countdown.value = 300;
    localStorage.setItem("countdownEndTime", String(now + 300000));
    localStorage.setItem("countdownEmail", email.value);
  }

  canResend.value = countdown.value === 0;

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
      if (countdown.value === 0) {
        localStorage.setItem("countdownEndTime", 0);
        canResend.value = true;
        clearInterval(countdownTimer);
      }
    }
  }, 1000);
};

const resetCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  const now = Date.now();
  localStorage.setItem("countdownEndTime", String(now + 300000));
  startCountdown();
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  await signOutUser();
  email.value = email.value || localStorage.getItem("countdownEmail");
  phone.value = phone.value || localStorage.getItem("countdownPhone");
  password.value = password.value || localStorage.getItem("countdownPassword");
  passwordConfirm.value =
    password.value || localStorage.getItem("countdownPassword");
  startCountdown();
});

// Add cleanup on component unmount
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
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
        lg="4"
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
          <!-- Back Button -->
          <v-card-text class="text-left pa-0">
            <v-btn variant="text" color="white" @click="goBack" class="mb-2">
              <v-icon size="16" start>mdi-arrow-left</v-icon>
              Back</v-btn
            >
          </v-card-text>

          <v-card-text class="text-center pb-0">
            <v-img src="/logo-white.svg" contain height="106"></v-img>
          </v-card-text>
          <v-card-text class="text-left">
            <form @submit.prevent="signInWithCredential">
              <v-otp-input
                v-model="otp"
                focus-all
                focused
                class="mb-4"
                :error-messages="otpErrors"
                @complete="signInWithCredential"
              ></v-otp-input>
              <v-alert
                density="compact"
                type="error"
                v-if="otpErrors.length"
                class="mb-3"
                >{{ otpErrors }}</v-alert
              >

              <v-checkbox
                v-model="termsAccepted"
                density="compact"
                :rules="[(v) => !!v || 'You must agree to continue']"
                hide-details
              >
                <template v-slot:label>
                  Agree to the &nbsp;
                  <a
                    href="/term-of-service"
                    target="_blank"
                    class="text-blue-darken-3 text-decoration-underline"
                    >Term of Use</a
                  >
                </template>
              </v-checkbox>

              <v-checkbox
                v-model="privacyAccepted"
                density="compact"
                :rules="[(v) => !!v || 'You must agree to continue']"
                hide-details
                class="mb-3"
              >
                <template v-slot:label>
                  Agree to the &nbsp;
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    class="text-blue-darken-3 text-decoration-underline"
                    >Privacy Policy</a
                  >
                </template>
              </v-checkbox>

              <v-btn
                type="submit"
                :loading="submitLoading"
                :disabled="!termsAccepted || !privacyAccepted"
                color="blue-darken-3"
                block
                class="mb-4"
                height="40"
                rounded="lg"
                >Continue</v-btn
              >
            </form>
          </v-card-text>
          <v-card-text class="pt-0">
            <p class="text-center">
              Not receive verification code ?
              <a
                @click="resendCode"
                :style="{
                  cursor: canResend ? 'pointer' : 'not-allowed',
                  color: canResend ? '#1976D2' : '#aaa',
                }"
                :class="{ 'text-decoration-underline': canResend }"
              >
                Resend Code
                <span v-if="!canResend">
                  ({{ Math.floor(countdown / 60) }}:{{
                    String(countdown % 60).padStart(2, "0")
                  }})</span
                >
              </a>
            </p>
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
