<template>
  <ClientOnly>
    <v-text-field
      ref="inputRef"
      :type="inputType"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="placeholder"
      append-inner-icon="mdi-calendar"
      @click:append-inner="showDatePicker"
      @focus="handleFocus"
      @blur="handleBlur"
      density="comfortable"
      :variant="variant"
      :class="classes"
      :rules="rules"
      :label="label"
      :hint="hint"
      :persistent-hint="persistentHint"
      :error-messages="errorMessages"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable"
      :bg-color="bgColor"
      :color="color"
      :rounded="rounded"
    />
  </ClientOnly>
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: "DD/MM/YYYY",
  },
  variant: {
    type: String,
    default: "outlined",
    validator: (value) =>
      ["plain", "outlined", "filled", "underlined", "solo"].includes(value),
  },
  classes: {
    type: [String, Object, Array],
    default: "",
  },
  density: {
    type: String,
    default: "comfortable",
    validator: (value) => ["default", "comfortable", "compact"].includes(value),
  },
  rules: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  persistentHint: {
    type: Boolean,
    default: false,
  },
  errorMessages: {
    type: [String, Array],
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  bgColor: {
    type: String,
    default: undefined,
  },
  color: {
    type: String,
    default: undefined,
  },
  rounded: {
    type: String,
    default: "lg",
    validator: (value) => ["lg", "full"].includes(value),
  },
});

defineEmits(["update:modelValue"]);

const inputType = ref("text");

// Referensi ke elemen input untuk kontrol picker
const inputRef = ref(null);

// Pastikan logika hanya di client
onMounted(() => {
  // Cek apakah browser mendukung input date
  const input = document.createElement("input");
  input.setAttribute("type", "date");
  if (input.type !== "date") {
    inputType.value = "text"; // Fallback permanen ke text jika date tidak didukung
  }
});

const handleFocus = () => {
  inputType.value = "date";
};

const handleBlur = (event) => {
  if (!event.target.value) {
    inputType.value = "text";
  }
  // Force close the picker by changing type temporarily
  if (inputRef.value) {
    const currentValue = inputRef.value.value;
    inputType.value = "text";
    inputRef.value.blur();
    // Restore the value since changing type might clear it
    setTimeout(() => {
      inputRef.value.value = currentValue;
    }, 0);
  }
};

const showDatePicker = (event) => {
  inputType.value = "date";
  // Langsung tampilkan date picker bawaan
  if (inputRef.value) {
    inputRef.value.focus();
    try {
      inputRef.value.showPicker(); // Memanggil showPicker untuk menampilkan date picker
    } catch (error) {
      // Handle browsers that don't support showPicker
      inputRef.value.click();
    }
  }
};
</script>

<style scoped>
:deep(.v-field__input) {
  color: inherit;
}
:deep(.v-field__input:invalid) {
  color: #aaa; /* Warna placeholder untuk Safari */
}
</style>
