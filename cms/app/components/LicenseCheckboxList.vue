<template>
  <div class="license-list">
    <v-text-field
      v-model="search"
      :label="label"
      :placeholder="placeholder"
      density="comfortable"
      variant="outlined"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      rounded="lg"
      @update:model-value="onSearch"
      :disabled="props.disabled"
    />

    <div class="list-container">
      <div
        v-if="displayItems.length === 0 && !loading"
        class="py-4 text-center text-medium-emphasis text-caption"
      >
        No licenses found.
      </div>
      <div class="d-flex align-center justify-end pr-2 py-1" v-if="loading">
        <v-progress-circular
          indeterminate
          color="primary"
          size="18"
          width="2"
        />
        <span class="ml-2 text-caption text-medium-emphasis">Searching...</span>
      </div>
      <v-list
        v-if="displayItems.length"
        density="comfortable"
        class="bg-transparent"
      >
        <v-list-item
          v-for="item in displayOrdered"
          :key="item.id"
          @click="toggle(item.id)"
          class="py-1"
        >
          <template #prepend>
            <v-checkbox
              :model-value="isChecked(item.id)"
              density="compact"
              hide-details
              :disabled="props.disabled"
              @click.stop="toggle(item.id)"
            />
          </template>
          <v-list-item-title>{{
            item.license_name || item.profession_name || item.name || item.id
          }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup>
import { debounce } from "~/utils/debounce";

const props = defineProps({
  items: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  label: { type: String, default: "Search license" },
  placeholder: { type: String, default: "Type to search license..." },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "search"]);

const search = ref("");
const selectedLabels = ref({});

const stashLabel = (item) => {
  if (!item?.id) return;
  const label =
    item.license_name || item.profession_name || item.name || item.id;
  selectedLabels.value = {
    ...selectedLabels.value,
    [item.id]: label,
  };
};

// Normalize items and keep checked items available even if not in current search
const normalizedItems = computed(() => {
  const map = new Map();
  (props.items || []).forEach((item) => {
    if (!item?.id) return;
    stashLabel(item);
    map.set(item.id, item);
  });
  (props.modelValue || []).forEach((id) => {
    if (!map.has(id)) {
      map.set(id, {
        id,
        license_name: selectedLabels.value[id] || id,
        profession_name: selectedLabels.value[id] || id,
        name: selectedLabels.value[id] || id,
      });
    }
  });
  return Array.from(map.values());
});

const filteredItems = computed(() => {
  if (!search.value) return normalizedItems.value;
  const term = search.value.toLowerCase();
  return normalizedItems.value.filter((item) =>
    (item.license_name || item.profession_name || item.name || "")
      .toLowerCase()
      .includes(term)
  );
});

// Stable order: follow normalizedItems order; include item if matches search or already checked
const displayItems = computed(() => {
  const checkedSet = new Set(props.modelValue || []);
  const term = search.value ? search.value.toLowerCase() : "";
  const match = (item) =>
    !term ||
    (item.license_name || item.profession_name || item.name || "")
      .toLowerCase()
      .includes(term);

  const result = [];
  normalizedItems.value.forEach((item) => {
    if (match(item) || checkedSet.has(item.id)) {
      result.push(item);
    }
  });
  return result;
});

// Push checked items to top when loading; otherwise keep original order
const displayOrdered = computed(() => {
  const checkedSet = new Set(props.modelValue || []);
  if (!props.loading) {
    return displayItems.value;
  }
  const checked = [];
  const unchecked = [];
  displayItems.value.forEach((item) => {
    if (checkedSet.has(item.id)) {
      checked.push(item);
    } else {
      unchecked.push(item);
    }
  });
  return [...checked, ...unchecked];
});

const isChecked = (id) => props.modelValue?.includes(id);

const toggle = (id) => {
  const found = normalizedItems.value.find((i) => i.id === id);
  if (found) stashLabel(found);
  const current = new Set(props.modelValue || []);
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  emit("update:modelValue", Array.from(current));
};

// Debounced search function
const debouncedEmitSearch = debounce((searchValue) => {
  emit("search", searchValue);
}, 300);

const onSearch = (val) => {
  search.value = val || "";
  debouncedEmitSearch(search.value);
};
</script>

<style scoped>
.license-list {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
}

.list-container {
  max-height: 260px;
  overflow: auto;
}
</style>
