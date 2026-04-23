<template>
  <div class="master-settings-page">
    <v-container fluid class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-5">
        <div>
          <h2 class="font-weight-medium mb-1">Other Masters</h2>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ entities.length }} entities
          </p>
        </div>
      </div>

      <!-- Search -->
      <v-row class="mb-3">
        <v-col cols="12" md="6" class="py-0">
          <v-text-field
            v-model="search"
            label="Search..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            rounded="lg"
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Content -->
      <div v-if="isLoading">
        <v-row>
          <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
            <v-skeleton-loader type="chip" />
          </v-col>
        </v-row>
      </div>

      <div v-else-if="groupedEntities.length === 0" class="text-center py-8">
        <v-icon
          icon="mdi-magnify"
          size="48"
          color="grey-lighten-1"
          class="mb-2"
        ></v-icon>
        <p class="text-body-2 text-medium-emphasis">No results found</p>
      </div>

      <div v-else class="pa-1">
        <div v-for="group in groupedEntities" :key="group.title" class="mb-4">
          <div class="d-flex align-center mb-2">
            <span class="text-caption font-weight-medium text-medium-emphasis">
              {{ group.title }} ({{ group.entities.length }})
            </span>
          </div>

          <v-row>
            <v-col
              v-for="entity in group.entities"
              :key="entity.name"
              cols="6"
              sm="4"
              md="3"
              lg="2"
              class="pa-2"
            >
              <v-card
                :to="`/admin/settings/masters/other-masters/${entity.name}`"
                class="entity-card rounded-lg"
                hover
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-center">
                    <v-avatar
                      :color="entity.backgroundColor || 'primary'"
                      size="32"
                      class="me-2"
                    >
                      <v-icon
                        :icon="entity.icon"
                        size="16"
                        color="white"
                      ></v-icon>
                    </v-avatar>
                    <div class="min-width-0">
                      <div class="font-weight-medium" style="font-size: 12px">
                        {{ entity.title }}
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

const { $apiFetch } = useApi();
const search = useState("masterdataSearch", () => "");

const entities = ref([]);
const isLoading = ref(true);

const groupedEntities = computed(() => {
  const groups = {};

  // Group entities
  entities.value.forEach((entity) => {
    if (!groups[entity.group]) {
      groups[entity.group] = [];
    }
    // Filter entities by search criteria
    if (entity.title.toLowerCase().includes(search.value.toLowerCase())) {
      groups[entity.group].push(entity);
    }
  });

  // Filter out groups with no matching entities
  return Object.keys(groups)
    .map((group) => ({
      title: group,
      entities: groups[group],
    }))
    .filter((group) => group.entities.length > 0);
});

onMounted(() => {
  isLoading.value = true;
  $apiFetch("/fields/entities").then((data) => {
    isLoading.value = false;
    entities.value = data;
  });
});
</script>

<style scoped>
.entity-card {
  transition: opacity 0.2s;
}

.entity-card:hover {
  opacity: 0.8;
}
</style>
