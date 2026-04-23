<template>
  <v-container>
    <!-- Profile Info -->

    <!-- Feedback Form -->
    <v-card rounded="lg" variant="flat" max-width="800px" class="mx-auto">
      <v-form @submit.prevent="handleSubmit" ref="vform">
        <v-card-text>
          <h2 class="font-weight-bold mb-1">Feedback</h2>
          <p class="text-grey-darken-1">
            Submit your feedback or issue, and we'll get back to you soon
          </p>
        </v-card-text>
        <v-card-text>
          <div class="mb-3">
            <div class="text-grey-darken-1 mb-2">Feedback Type</div>
            <v-select
              v-model="form.type"
              :items="feedbackTypes"
              variant="outlined"
              density="comfortable"
              item-title="label"
              item-value="value"
              rounded="lg"
              placeholder="Select feedback type"
              :rules="[(v) => !!v || 'Feedback type is required']"
            ></v-select>
          </div>

          <div class="mb-3">
            <div class="text-grey-darken-1 mb-2">Description</div>
            <v-textarea
              v-model="form.description"
              variant="outlined"
              density="comfortable"
              class="rounded-lg"
              placeholder="Write short description about your issues."
              counter
              maxlength="3000"
              no-resize
              rows="6"
              rounded="lg"
              :rules="[(v) => !!v || 'Description is required']"
              auto-grow
              style="white-space: pre-wrap !important; resize: vertical"
            ></v-textarea>
          </div>
          <div class="mb-8">
            <div class="text-grey-darken-1 mb-2">Attachment</div>
            <v-file-upload
              v-model="form.attachment_url"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading.sync="loadingUpload"
              class="rounded-lg"
              category="feedback"
              placeholder="Upload attachment (max size 20MB)"
              :max-size="20"
              :accept="'.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mkv,.mp3,.wav,.m4a,.ogg,.webm,.webp'"
            ></v-file-upload>
          </div>

          <v-btn
            block
            color="primary"
            size="large"
            height="48"
            :loading="loading"
            type="submit"
            :disabled="loadingUpload"
            class="rounded-lg text-none"
          >
            SUBMIT
          </v-btn>
        </v-card-text>
      </v-form>
    </v-card>
    <v-dialog v-model="loadingInitial" persistent width="auto" max-width="200">
      <v-card
        height="130"
        class="d-flex flex-column align-center justify-center text-center mx-auto pa-3"
        rounded="xl"
        style="background-color: rgba(255, 255, 255, 0.9)"
      >
        <v-img :src="`/logo-double.svg`" width="100" class="mb-3" />
        <div class="d-flex align-center justify-center mb-2">
          <v-progress-circular
            size="25"
            width="3"
            indeterminate
            color="primary"
            class="mr-2"
          >
          </v-progress-circular>
          <strong style="font-size: 16px" class="text-primary">
            Loading...
          </strong>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const loadingUpload = ref(false);

// Data
const feedbackTypes = [
  {
    label: "Request",
    value: "REQUEST",
  },
  {
    label: "General",
    value: "GENERAL",
  },
  {
    label: "Suggestion",
    value: "SUGGESTION",
  },
  {
    label: "Issue",
    value: "ISSUE",
  },
  {
    label: "Request Deletion",
    value: "REQUEST_DELETION",
  },
];

const { me, fetchMe } = useUser();
const loadingInitial = ref(true);

const form = ref({
  type: null,
  description: "",
  attachment_url: null,
});

const resetForm = () => {
  form.value = {
    type: null,
    description: "",
    attachment_url: null,
  };
};

const snackbar = useSnackbarStore();
const { $apiFetch } = useApi();
const vform = ref(null);
const handleSubmit = async () => {
  const { valid } = await vform.value.validate();
  if (!valid) return;
  try {
    loading.value = true;
    if (route.query.id) {
      const response = await $apiFetch(`/feedbacks/${route.query.id}`, {
        method: "PATCH",
        body: form.value,
      });
    } else {
      const response = await $apiFetch("/feedbacks", {
        method: "POST",
        body: form.value,
      });
    }

    snackbar.showSnackbar({
      message: "Feedback submitted successfully",
      color: "success",
    });

    setTimeout(() => {
      resetForm();
    }, 1000);
  } catch (error) {
    console.error("Error submitting feedback:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  form.value.user_id = me.value.id;
  if (route.query.id) {
    const data = await $apiFetch(`/feedbacks/search`, {
      params: {
        filters: {
          id: route.query.id,
        },
      },
    });
    Object.assign(form.value, data.items[0]);
  }
  loadingInitial.value = false;
});
</script>
