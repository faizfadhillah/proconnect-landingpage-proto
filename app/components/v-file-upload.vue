<!-- components/v-file-upload.vue -->
<template>
  <div>
    <v-card
      :min-height="minHeight"
      rounded="lg"
      class="border-grey"
      elevation="0"
      :loading="loadingInternal"
      :style="{
        border: hasError
          ? '1px solid rgb(var(--v-theme-error))'
          : '1px solid #bbb',
      }"
      :disabled="disabled"
    >
      <template v-if="modelValue || modelValue?.file_url">
        <v-card-text class="text-grey py-3 pr-6" style="font-size: 15px">
          <a
            @click="downloadFile(modelValue.file_url || modelValue)"
            style="cursor: pointer"
            class="text-truncate d-block"
          >
            {{ modelValue.file_name || modelValue.file_url || modelValue }}
          </a>
        </v-card-text>
        <v-icon
          v-if="!readonly"
          @click="handleRemove"
          size="24"
          color="grey-darken-2"
          style="position: absolute; right: 10px; top: 10px"
          >mdi-close</v-icon
        >
      </template>
      <template v-else>
        <v-card-text
          @click="triggerUpload"
          class="py-3"
          :class="disabled ? 'text-grey-lighten-2' : 'text-grey'"
          :style="{
            fontSize: '15px',
            cursor: readonly ? 'default' : 'pointer',
            opacity: readonly ? 0.6 : 1,
          }"
        >
          {{ readonly ? "No file uploaded" : placeholder }}
          <v-icon
            v-if="!readonly"
            size="24"
            :color="disabled ? 'grey-lighten-2' : 'grey-darken-2'"
            style="position: absolute; right: 10px; top: 10px"
            >mdi-plus</v-icon
          >
        </v-card-text>
      </template>
    </v-card>
    <input
      type="file"
      ref="fileInput"
      :accept="accept"
      style="display: none"
      @change="handleFileUpload"
      :disabled="readonly"
    />
    <!-- Display validation errors -->
    <div
      v-if="hasError"
      class="v-messages v-field__messages"
      role="alert"
      aria-live="polite"
    >
      <div class="v-messages__message text-error">
        {{ displayError }}
      </div>
    </div>
  </div>
</template>

<script setup>
const { $apiFetch } = useApi();

const props = defineProps({
  modelValue: {
    type: [Object, String],
    default: null,
  },
  vObject: {
    type: Object,
    default: () => ({
      file_name: null,
      file_url: null,
      file_type: null,
    }),
  },
  category: {
    type: String,
    required: true,
  },
  accept: {
    type: String,
    default: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif",
  },
  maxSize: {
    type: Number,
    default: 5, // in MB
  },
  placeholder: {
    type: String,
    default: "Upload file (max size 5MB)",
  },
  minHeight: {
    type: Number,
    default: 48,
  },
  error: {
    type: String,
    default: "",
  },
  errorMessages: {
    type: [String, Array],
    default: "",
  },
  // Add rules prop for validation
  rules: {
    type: Array,
    default: () => [],
  },
  userId: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "error",
  "update:loading",
  "update:vObject",
]);
const loadingInternal = ref(false);
const fileInput = ref(null);
const internalError = ref("");

// Validate rules
const validateRules = () => {
  if (!props.rules || props.rules.length === 0) return [];

  const errors = [];
  for (const rule of props.rules) {
    if (typeof rule === "function") {
      const result = rule(props.modelValue);
      if (result !== true && result) {
        errors.push(result);
      }
    }
  }
  return errors;
};

// Computed properties for error handling
const ruleErrors = computed(() => validateRules());

const hasError = computed(() => {
  return !!(
    props.error ||
    internalError.value ||
    props.errorMessages ||
    ruleErrors.value.length > 0
  );
});

const displayError = computed(() => {
  // Priority: internal error > prop error > errorMessages > rule errors
  if (internalError.value) return internalError.value;
  if (props.error) return props.error;
  if (props.errorMessages) {
    return Array.isArray(props.errorMessages)
      ? props.errorMessages.join(", ")
      : props.errorMessages;
  }
  if (ruleErrors.value.length > 0) {
    return ruleErrors.value[0]; // Show first rule error
  }
  return "";
});

// Watch for modelValue changes to trigger validation
watch(
  () => props.modelValue,
  () => {
    // Clear internal error when value changes
    if (internalError.value) {
      internalError.value = "";
    }
  },
  { deep: true }
);

const triggerUpload = () => {
  if (props.readonly) return;
  fileInput.value.click();
};

const clearError = () => {
  internalError.value = "";
  emit("error", "");
};

const handleFileUpload = async (event) => {
  internalError.value = "";
  console.log("handleFileUpload", event);
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  const acceptedTypes = props.accept.split(",").map((type) => type.trim());
  const fileExtension = file.name.split(".").pop().toLowerCase();

  // Check if file type is accepted
  const isAcceptedType = acceptedTypes.some((type) => {
    // Remove the dot if present and compare
    const cleanType = type.replace(".", "");
    return fileExtension === cleanType;
  });

  if (!isAcceptedType) {
    internalError.value = `File type not allowed. Accepted types: ${props.accept}`;
    emit("error", internalError.value);
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    return;
  }

  // Validate file size
  if (file.size > props.maxSize * 1024 * 1024) {
    internalError.value = `File size should not exceed ${props.maxSize}MB`;
    emit("error", internalError.value);
    return;
  }

  loadingInternal.value = true;
  emit("update:loading", true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", props.category);

    const response = await $apiFetch("/media", {
      method: "POST",
      body: formData,
    });

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (props.userId) {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      $apiFetch("/user-files", {
        method: "POST",
        body: {
          user_id: props.userId,
          file_name: file.name,
          file_url: response.path,
          file_type: fileExtension,
        },
      });
    }

    emit("update:modelValue", response.path);
    emit("update:vObject", {
      file_name: file.name,
      file_url: response.path,
      file_type: fileExtension,
    });

    emit("error", ""); // Clear any previous errors
  } catch (error) {
    internalError.value =
      error.message || "An error occurred while uploading the file";
    emit("error", internalError.value);
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  } finally {
    loadingInternal.value = false;
    emit("update:loading", false);
  }
};

const handleRemove = () => {
  if (props.readonly) return;
  emit("update:modelValue", null);
  emit("update:vObject", {
    file_name: null,
    file_url: null,
    file_type: null,
  });
};

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const downloadFile = (url) => {
  window.open(BASE_URL + url, "_blank");
};

// Expose validate method for external validation (like form validation)
const validate = () => {
  return ruleErrors.value.length === 0;
};

// Expose validation methods to parent
defineExpose({
  validate,
  hasError,
  ruleErrors,
});
</script>

<style scoped>
.text-error {
  color: rgb(var(--v-theme-error));
}

.v-messages {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.0333333333em;
  line-height: 12px;
  min-height: 14px;
  padding-top: 6px;
}

.v-messages__message {
  line-height: 12px;
  word-break: break-word;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}
</style>
