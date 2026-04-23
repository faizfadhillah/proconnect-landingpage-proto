<template>
  <div class="rich-text-viewer mb-6">
    <div class="ql-editor" v-html="formattedContent"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [Object, String, Array],
    default: null,
  },
});

// Lazy load Quill only on client side
const quillModule = ref(null);
const isClient = ref(false);

onMounted(async () => {
  if (process.client) {
    try {
      // Only import on client side
      const module = await import("@vueup/vue-quill");
      quillModule.value = module;
      
      // Import CSS only on client
      await import("@vueup/vue-quill/dist/vue-quill.snow.css");
      isClient.value = true;
    } catch (e) {
      console.error("Error loading Quill:", e);
    }
  }
});

// Helper function to ensure proper Delta format
const ensureDeltaFormat = (value) => {
  if (!value) {
    if (isClient.value && quillModule.value?.Delta) {
      return new quillModule.value.Delta();
    }
    return { ops: [] };
  }

  // On server side, return the value as is (will be handled by deltaToHtml)
  if (!isClient.value || !quillModule.value?.Delta) {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // If it's an array, wrap it in object with ops property
        if (Array.isArray(parsed)) {
          return { ops: parsed };
        }
        // If it's an object with ops, return as is
        if (parsed && typeof parsed === 'object' && parsed.ops) {
          return parsed;
        }
        return { ops: [{ insert: value }] };
      } catch (e) {
        return { ops: [{ insert: value }] };
      }
    }
    // If it's an array directly, wrap it
    if (Array.isArray(value)) {
      return { ops: value };
    }
    return value;
  }

  const Delta = quillModule.value.Delta;

  try {
    // If it's already a Delta instance, return it
    if (value instanceof Delta) {
      return value;
    }

    // If it's a string, try to parse it
    if (typeof value === "string") {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(value);
        // If it's an array, wrap it in object with ops property
        if (Array.isArray(parsed)) {
          return new Delta({ ops: parsed });
        }
        // If it's an object, use it directly
        return new Delta(parsed);
      } catch (e) {
        // If parsing fails, treat as plain text
        return new Delta([{ insert: value }]);
      }
    }

    // If it's an array, wrap it in object with ops property
    if (Array.isArray(value)) {
      return new Delta({ ops: value });
    }

    // If it's an object, create new Delta
    return new Delta(value);
  } catch (e) {
    console.error("Error formatting Delta:", e);
    return new Delta();
  }
};

// Convert Delta to HTML
const formattedContent = computed(() => {
  // On server side, return empty string (will use fallback)
  if (!isClient.value || !quillModule.value?.Quill || !quillModule.value?.Delta) {
    return '';
  }

  try {
    const Quill = quillModule.value.Quill;
    const delta = ensureDeltaFormat(props.modelValue);
    // Create a temporary div to hold the Quill editor
    const tempDiv = document.createElement("div");
    const quill = new Quill(tempDiv, {
      readOnly: true,
      modules: {
        toolbar: false,
      },
    });
    quill.setContents(delta);
    return quill.root.innerHTML;
  } catch (e) {
    console.error("Error converting Delta to HTML:", e);
    return '';
  }
});
</script>

<style scoped>
.rich-text-viewer {
  width: 100%;
}

.ql-editor {
  font-size: 14px;
  padding: 0;
  border: none;
  background: transparent;
}

/* Remove any interactive elements */
.ql-editor :deep(a) {
  pointer-events: none;
  text-decoration: none;
  color: inherit;
}
</style>
