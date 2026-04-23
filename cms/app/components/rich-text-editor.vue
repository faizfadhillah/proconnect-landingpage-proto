<template>
  <div class="rich-text-editor">
    <QuillEditor
      v-model:content="content"
      :contentType="contentType"
      theme="snow"
      :options="{
        placeholder: placeholder,
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['clean'],
          ],
        },
      }"
      class="mb-4"
      :rules="rules"
      @update:content="handleContentUpdate"
    />
  </div>
</template>

<script setup>
import { QuillEditor } from "@vueup/vue-quill";
import { Delta } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";

const props = defineProps({
  modelValue: {
    type: [Object, String, Array],
    default: () => new Delta(),
  },
  placeholder: {
    type: String,
    default: "Enter text here...",
  },
  rules: {
    type: Array,
    default: () => [],
  },
  contentType: {
    type: String,
    default: "delta",
  },
});

const emit = defineEmits(["update:modelValue"]);

// Initialize content with proper Delta format
const content = ref(new Delta());

// Helper function to ensure proper Delta format
const ensureDeltaFormat = (value) => {
  if (!value) return new Delta();

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
        return new Delta(parsed);
      } catch (e) {
        // If parsing fails, treat as plain text
        return new Delta([{ insert: value }]);
      }
    }

    // If it's an array or object, create new Delta
    return new Delta(value);
  } catch (e) {
    console.error("Error formatting Delta:", e);
    return new Delta();
  }
};

// Initialize content
content.value = ensureDeltaFormat(props.modelValue);

const handleContentUpdate = (newContent) => {
  emit("update:modelValue", newContent);
};

watch(
  () => props.modelValue,
  (newValue) => {
    const formattedDelta = ensureDeltaFormat(newValue);
    if (JSON.stringify(formattedDelta) !== JSON.stringify(content.value)) {
      content.value = formattedDelta;
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
}

.ql-editor {
  min-height: 200px;
  font-size: 14px;
}

.ql-container {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.ql-toolbar {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
</style>
