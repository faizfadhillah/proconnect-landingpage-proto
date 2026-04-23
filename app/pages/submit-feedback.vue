<script setup>
const type = ref();
const typeErrors = ref([]);
const feedbackTypes = useState("feedbackTypes", () => []);
const email = ref();
const emailErrors = ref([]);
const description = ref();
const descriptionErrors = ref([]);
const providerErrors = ref([]);
const submitLoading = ref(false);

const isAuthenticating = useState("isAuthenticating", () => false);
const authStore = useAuthStore();
const { $apiFetch } = useApi();
const router = useRouter();
const isSuccessMessage = ref("");

//google dan apple
const getFeedbackTypes = async () => {
  $apiFetch("/configs/key/feedback_types").then((res) => {
    feedbackTypes.value = res.value;
  });
};

const resetFeedback = async () => {
  type.value = null;
  typeErrors.value = null;
  email.value = null;
  emailErrors.value = null;
  description.value = null;
  descriptionErrors.value = null;
  isSuccessMessage.value = null;
};

const submitFeedback = async () => {
  isSuccessMessage.value = "";
  isAuthenticating.value = true;
  submitLoading.value = true;
  try {
    const data = await $apiFetch("/feedbacks", {
      method: "POST",
      body: {
        email: email.value,
        type: type.value,
        description: description.value,
      },
    });
    isSuccessMessage.value = `Your feedback has been successfully submitted!<br/>
Thank you for reaching out to us. Your request has been recorded, and you have been assigned a ticket number: #${data.code}`;
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
          } else if (errMsg.includes("type")) {
            typeErrors.value.push(errMsg);
          } else if (errMsg.includes("description")) {
            descriptionErrors.value.push(errMsg);
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
  getFeedbackTypes();
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
        sm="10"
        md="10"
        lg="8"
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
          <v-card-title>
            <v-btn
              to="/login"
              icon="mdi-arrow-left"
              style="position: absolute; z-index: 9"
              size="small"
            ></v-btn>
            <v-img src="/logo-white.svg" contain height="106"></v-img>
            <v-spacer />
          </v-card-title>

          <v-card-text>
            <h2 class="mt-8">Submit a Feedback or Request Deletion ?</h2>
            <p>
              Use this form to submit feedback about ProConnect or request
              account deletion. Select the type of feedback, enter your email,
              and provide details in the message box. Our team will review your
              submission and respond as soon as possible.
            </p>
          </v-card-text>
          <template v-if="!isSuccessMessage">
            <v-card-text>
              <form @submit.prevent="submitFeedback()">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-select
                      label="Feedbacks Type"
                      prepend-inner-icon="mdi-ticket"
                      required
                      v-model="type"
                      :items="feedbackTypes"
                      item-title="label"
                      item-value="name"
                      :error-messages="typeErrors"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-text-field
                      label="Your Email"
                      prepend-inner-icon="mdi-email"
                      required
                      type="email"
                      v-model="email"
                      :error-messages="emailErrors"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      label="Description or message"
                      required
                      v-model="description"
                      :error-messages="descriptionErrors"
                      :rows="5"
                      class="mb-6"
                      auto-grow
                      style="white-space: pre-wrap !important; resize: vertical"
                    ></v-textarea>
                  </v-col>
                </v-row>

                <v-btn
                  type="submit"
                  :loading="submitLoading"
                  :disabled="isSuccessMessage ? true : false"
                  color="blue-darken-3"
                  block
                  rounded="lg"
                  height="40"
                  >Submit Feedback</v-btn
                >
              </form>
            </v-card-text>
          </template>
          <v-card-text v-if="isSuccessMessage">
            <v-alert
              type="success"
              class="text-subtitle-1"
              v-html="isSuccessMessage"
            ></v-alert>
          </v-card-text>
          <v-card-actions v-if="isSuccessMessage">
            <v-spacer />

            <v-btn @click="resetFeedback()" color="yellow" variant="elevated"
              >Create Another Feedback</v-btn
            >
            <v-btn to="/login" color="primary" class="mr-2" variant="elevated"
              >Finish</v-btn
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
