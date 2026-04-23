<template>
  <v-dialog v-model="dialogModel" max-width="550" persistent>
    <v-card rounded="xl" elevation="0">
      <v-toolbar density="compact" flat class="bg-transparent">
        <v-toolbar-title class="font-weight-bold">Share this job</v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="closeDialog" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-divider />
      <v-card-text class="pt-4">
        <div class="text-body-2 text-grey-darken-1 mb-6">
          Share this opportunity with your network or copy the link.
        </div>

        <!-- Sharing Options -->
        <div class="d-flex justify-space-between mb-6 mx-4">
          <v-btn
            icon
            variant="text"
            size="large"
            @click="shareOnWhatsApp"
            class="flex-column"
            style="flex-direction: column"
          >
            <v-icon size="32" color="success">mdi-whatsapp</v-icon>
            <span class="text-caption mt-1">WhatsApp</span>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="large"
            @click="shareOnLinkedIn"
            class="flex-column"
            style="flex-direction: column"
          >
            <v-icon size="32" color="primary">mdi-linkedin</v-icon>
            <span class="text-caption mt-1">LinkedIn</span>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="large"
            @click="shareOnTwitter"
            class="flex-column"
            style="flex-direction: column"
          >
            <v-icon size="32" color="info">mdi-twitter</v-icon>
            <span class="text-caption mt-1">Twitter</span>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="large"
            @click="shareOnFacebook"
            class="flex-column"
            style="flex-direction: column"
          >
            <v-icon size="32" color="primary">mdi-facebook</v-icon>
            <span class="text-caption mt-1">Facebook</span>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="large"
            @click="shareOnEmail"
            class="flex-column"
            style="flex-direction: column"
          >
            <v-icon size="32" color="grey-darken-1">mdi-email</v-icon>
            <span class="text-caption mt-1">Email</span>
          </v-btn>
        </div>

        <!-- Page Link Section -->
        <div class="mb-2">
          <div class="text-caption text-grey-darken-1 mb-2">Page Link</div>
          <div class="d-flex align-center">
            <v-text-field
              :model-value="jobUrl"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              class="mr-2"
              rounded="lg"
            ></v-text-field>
            <v-btn
              icon
              color="primary"
              variant="flat"
              @click="copyLink"
              size="small"
            >
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  jobId: {
    type: [String, Number],
    required: true,
  },
  jobTitle: {
    type: String,
    default: "",
  },
  companyName: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const snackbar = useSnackbarStore();

const getJobUrl = () => {
  if (process.client) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/jobs/${props.jobId}`;
  }
  return `https://proconnectcareer.com/jobs/${props.jobId}`;
};

const jobUrl = computed(() => getJobUrl());

const getShareText = () => {
  const locationText = props.location || "Unknown Location";
  return `Job vacancy for *${props.jobTitle || "this position"}* in *${props.companyName || "this company"}* located in *${locationText}* has been open. \n \nClick this link to view job vacancy.`;
};

const closeDialog = () => {
  dialogModel.value = false;
};

const shareOnWhatsApp = () => {
  const url = jobUrl.value;
  const text = getShareText();
  const encodedText = encodeURIComponent(`${text} ${url}`);
  window.open(`https://wa.me/?text=${encodedText}`, "_blank");
};

const shareOnLinkedIn = () => {
  const url = encodeURIComponent(jobUrl.value);
  const summary = encodeURIComponent(getShareText());
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${summary}`,
    "_blank"
  );
};

const shareOnTwitter = () => {
  const url = encodeURIComponent(jobUrl.value);
  const text = encodeURIComponent(getShareText());
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
};

const shareOnFacebook = () => {
  const url = encodeURIComponent(jobUrl.value);
  const quote = encodeURIComponent(getShareText());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, "_blank");
};

const shareOnEmail = () => {
  const url = jobUrl.value;
  const subject = encodeURIComponent(
    `Job Vacancy: ${props.jobTitle || "Position Available"}${props.companyName ? ` at ${props.companyName}` : ""}`
  );
  const body = encodeURIComponent(`${getShareText()}\n\n${url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

const copyLink = async () => {
  try {
    const url = jobUrl.value;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      snackbar.showSnackbar({
        message: "Link copied to clipboard!",
        color: "success",
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      snackbar.showSnackbar({
        message: "Link copied to clipboard!",
        color: "success",
      });
    }
  } catch (err) {
    snackbar.showSnackbar({
      message: "Failed to copy link",
      color: "error",
    });
  }
};
</script>

<style scoped>
.v-btn.flex-column {
  flex-direction: column;
  height: auto;
  min-width: 60px;
}
</style>
