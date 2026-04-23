<template>
  <v-text-field
    ref="field"
    :prefix="prefix"
    v-model="model"
    @focus="onFocus"
    @keyup="onKeyUp"
    :error-messages="errorMessages"
    v-bind="$attrs"
    @change="onChange"
    @blur="onBlur"
  ></v-text-field>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { debounce } from "~/utils/debounce";

const props = defineProps({
  modelValue: [Number, String], // Untuk kompatibilitas v-model
  errorMessages: [String, Array],
  allowNegative: {
    type: Boolean,
    default: false,
  },
  prefix: {
    type: String,
    default: "IDR",
  },
  thousandsSeparator: {
    type: String,
    default: ".",
  },
  decimalSeparator: {
    type: String,
    default: ",",
  },
  languageCode: {
    type: String,
    default: "id-ID",
  },
});

const emit = defineEmits(["update:modelValue", "change", "blur"]);

const field = ref(null);
const numberValue = ref(props.modelValue || 0);
const model = ref(""); // Model teks yang akan ditampilkan
const isMasked = ref(true);

// Regex untuk menghapus separator ribuan dan mengganti desimal
const thousandsSeparatorRegex = computed(
  () => new RegExp(`\\${props.thousandsSeparator}`, "g")
);
const decimalSeparatorRegex = computed(
  () => new RegExp(`\\${props.decimalSeparator}`, "g")
);

// Fungsi Parsing Angka
const tryParseFloat = (str) => {
  if (!str) return 0;

  // Hilangkan pemisah ribuan
  let rawValue = str.replace(thousandsSeparatorRegex.value, "");

  // Ganti decimalSeparator menjadi titik agar bisa diparse sebagai angka
  if (props.decimalSeparator !== ".") {
    rawValue = rawValue.replace(decimalSeparatorRegex.value, ".");
  }

  const parsed = parseFloat(rawValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Fungsi Fokus
const onFocus = () => {
  isMasked.value = false;
  model.value = numberValue.value.toString(); // Kembalikan ke angka asli
};

// Fungsi Blur
const onBlur = () => {
  isMasked.value = true;
  format();
  emit("blur");
};

// Fungsi Key Up
const onKeyUp = debounce(() => {
  updateNumberValue();
}, 300);

// Fungsi Change
const onChange = () => {
  emit("change");
};

// Fungsi Update Angka (dengan debounce)
const updateNumberValue = () => {
  let parsedValue = tryParseFloat(model.value);

  if (!props.allowNegative && parsedValue < 0) parsedValue = 0;

  numberValue.value = Math.round(parsedValue * 100) / 100;

  model.value = numberValue.value.toLocaleString(props.languageCode, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  emit("update:modelValue", numberValue.value);
};

// Fungsi Format
const format = () => {
  model.value = numberValue.value.toLocaleString(props.languageCode, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Watch perubahan nilai dari luar
watch(
  () => props.modelValue,
  (newValue) => {
    numberValue.value = newValue || 0;
    if (!field.value?.isFocused) {
      format();
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
