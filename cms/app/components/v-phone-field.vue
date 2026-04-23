<template>
  <v-text-field
    ref="field"
    :label="isSignup ? 'Phone' : ''"
    required
    v-model="phoneNumber"
    type="tel"
    :error-messages="errorMessages"
    placeholder="Input phone number"
    :rules="computedPhoneRules"
    v-bind="$attrs"
    @blur="onBlur"
    @input="onInput"
    :rounded="isSignup ? 'md' : 'lg'"
  >
    <template v-slot:prepend>
      <v-select
        v-model="selectedCountryCode"
        :items="countryCodes"
        item-title="name"
        item-value="dial_code"
        return-object
        class="country-code-select"
        hide-details
        :label="isSignup ? 'Code' : ''"
        :variant="isSignup ? 'filled' : 'outlined'"
        :menu-props="{ maxHeight: 300 }"
        :rounded="isSignup ? 'md' : 'lg'"
        :density="$attrs.density"
      >
        <template v-slot:selection="{ item }">
          <span class="me-2">{{ item.raw.flag }}</span>
          {{ item.raw.dial_code }}
        </template>
        <template v-slot:item="{ item, props }">
          <v-list-item
            v-bind="props"
            :title="`${item.raw.name} (${item.raw.dial_code})`"
          >
            <template v-slot:prepend>
              <span class="me-2">{{ item.raw.flag }}</span>
            </template>
          </v-list-item>
        </template>
      </v-select>
    </template>
  </v-text-field>
</template>

<script setup>
import { ref, computed, watch, onMounted, useAttrs } from "vue";

const props = defineProps({
  modelValue: [String], // Full phone number dengan country code
  phoneNumber: [String], // Phone number tanpa country code
  errorMessages: [String, Array],
  label: {
    type: String,
    default: "Phone",
  },
  placeholder: {
    type: String,
    default: "Input phone number",
  },
  defaultCountry: {
    type: String,
    default: "ID",
  },
  isSignup: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "update:phoneNumber", "blur"]);

const field = ref(null);
const phoneNumber = ref(props.phoneNumber || "");

// Ubah countryCodes menjadi reactive
const countryCodes = ref([
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
]);

// Set default country - perbaiki inisialisasi
const selectedCountryCode = ref(
  countryCodes.value.find((c) => c.code === props.defaultCountry) ||
    countryCodes.value[0]
);

const { $apiFetch } = useApi();

// Fungsi untuk parsing phone number dari modelValue
const parsePhoneNumber = (fullPhone) => {
  if (!fullPhone) return;

  const match = fullPhone.match(/^(\+\d{1,4})\s*(.+)$/);
  if (match) {
    const [, dialCode, phone] = match;
    const country = countryCodes.value.find((c) => c.dial_code === dialCode);
    if (country) {
      selectedCountryCode.value = country;
      phoneNumber.value = phone.replace(/\D/g, "");
      return true;
    }
  } else if (fullPhone.startsWith("+")) {
    phoneNumber.value = fullPhone.replace(/\D/g, "");
    return true;
  }
  return false;
};

const fetchCountryCodes = async () => {
  try {
    const res = await $apiFetch("/mst-country/search", {
      params: {
        search: "",
        limit: 100,
      },
    });
    countryCodes.value = res.items.map((item) => ({
      name: item.name,
      dial_code: item.dial_code,
      code: item.code,
      flag: item.flag_emoji,
    }));

    // Re-set selectedCountryCode setelah data ter-update
    const defaultCountry = countryCodes.value.find(
      (c) => c.code === props.defaultCountry
    );
    if (defaultCountry) {
      selectedCountryCode.value = defaultCountry;
    }

    // PERBAIKAN: Parse ulang modelValue setelah country codes ter-load
    if (props.modelValue) {
      parsePhoneNumber(props.modelValue);
    }
  } catch (error) {
    console.error("Failed to fetch country codes:", error);
  }
};

// Gunakan useAttrs untuk mengakses $attrs
const attrs = useAttrs();

// Phone validation rules - bisa di-override dari $attrs
const defaultPhoneRules = [
  (v) => !v || /^[0-9]{1,}$/.test(v) || "Phone must be numbers only",
  (v) => !v || v.length >= 9 || "Phone number must be at least 9 digits",
];

// Computed phoneRules yang mengambil dari $attrs jika tersedia
const computedPhoneRules = computed(() => {
  // Jika ada phoneRules di $attrs, gunakan itu
  if (attrs.phoneRules) {
    return attrs.phoneRules;
  }
  // Jika tidak ada, gunakan defaultPhoneRules
  return defaultPhoneRules;
});

// Computed full phone number
const fullPhoneNumber = computed(() => {
  if (phoneNumber.value && selectedCountryCode.value) {
    if (phoneNumber.value.startsWith("+")) {
      const match = phoneNumber.value.match(/^(\+\d{1,4})\s*(.+)$/);
      if (match) {
        const [, dialCode, phone] = match;
        return `${dialCode} ${phone}`;
      }
      return phoneNumber.value;
    } else {
      return `${selectedCountryCode.value.dial_code} ${phoneNumber.value}`;
    }
  }
  return "";
});

// Watch for changes and emit events - PERBAIKAN UTAMA
watch(
  [phoneNumber, selectedCountryCode],
  ([newPhone, newCountryCode]) => {
    newPhone = newPhone || phoneNumber.value;
    if (newPhone && newCountryCode) {
      let fullPhone;
      if (newPhone.startsWith("+")) {
        const match = newPhone.match(/^(\+\d{1,4})\s*(.+)$/);
        if (match) {
          const [, dialCode, phone] = match;
          fullPhone = `${dialCode} ${phone}`;
        } else {
          fullPhone = newPhone;
        }
      } else {
        fullPhone = `${newCountryCode.dial_code} ${newPhone}`;
      }
      emit("update:modelValue", fullPhone);
    } else if (newPhone && !newCountryCode) {
      return;
    } else {
      return;
      //emit("update:modelValue", "");
    }
    //emit("update:phoneNumber", newPhone);
  },
  { deep: true }
);

// Watch for external changes to modelValue - PERBAIKAN
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== fullPhoneNumber.value) {
      // Hanya parse jika country codes sudah ter-load
      if (countryCodes.value.length > 0) {
        // Indikator sudah ter-load dari API
        parsePhoneNumber(newValue);
      }
    }
  },
  { immediate: true }
);

// Watch for external changes to phoneNumber prop
watch(
  () => props.phoneNumber,
  (newValue) => {
    if (newValue !== phoneNumber.value) {
      phoneNumber.value = newValue ? newValue.replace(/\D/g, "") : "";
    }
  },
  { immediate: true }
);

const onBlur = () => {
  emit("blur");
};

const onInput = () => {
  phoneNumber.value = phoneNumber.value.replace(/\D/g, "");
  emit("update:phoneNumber", phoneNumber.value);
};

onMounted(async () => {
  await fetchCountryCodes();
  // Emit initial value setelah country codes loaded
  if (phoneNumber.value && selectedCountryCode.value) {
    const fullPhone = `${selectedCountryCode.value.dial_code} ${phoneNumber.value}`;
    emit("update:modelValue", fullPhone);
  }
});
</script>

<style scoped>
.country-code-select {
  max-width: 120px;
}
</style>
