<template>
  <div class="master-settings-page">
    <!-- Header Section -->
    <div class="page-header">
      <v-container fluid>
        <v-row align="center">
          <v-col cols="12">
            <div class="d-flex align-center mb-2">
              <v-breadcrumbs
                :items="[
                  {
                    title: 'Dashboard',
                    disabled: false,
                    to: '/admin/dashboard',
                  },
                  {
                    title: 'Master Data',
                    disabled: true,
                    to: '/admin/settings/masters',
                  },
                ]"
                divider="/"
                class="pa-0"
              ></v-breadcrumbs>
            </div>

            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <h1 class="font-weight-bold">Master Data Management</h1>
                <p class="xtext-medium-emphasis mb-0 ml-1">
                  Manage and configure system master data
                </p>
              </div>

              <div class="d-flex align-center gap-3">
                <v-chip
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-database"
                >
                  {{ entities.length }} Entities
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Search Section -->
    <v-container fluid>
      <v-row class="mb-6">
        <v-col cols="12" md="8" lg="6" class="pt-4">
          <v-text-field
            v-model="search"
            label="Search master data..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            rounded="lg"
            hide-details
            class="search-field"
          >
            <template v-slot:append-inner>
              <v-icon
                v-if="search"
                icon="mdi-close"
                @click="search = ''"
                class="cursor-pointer"
              ></v-icon>
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <!-- Content Section -->
      <div v-if="isLoading" class="loading-section">
        <v-row>
          <v-col
            v-for="n in 8"
            :key="n"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="mb-4"
          >
            <v-skeleton-loader type="card" class="rounded-lg" />
          </v-col>
        </v-row>
      </div>

      <div v-else-if="groupedEntities.length === 0" class="empty-state">
        <v-card
          class="text-center pa-8 rounded-lg"
          elevation="0"
          variant="outlined"
        >
          <v-icon
            icon="mdi-magnify"
            size="64"
            color="grey-lighten-1"
            class="mb-4"
          ></v-icon>
          <h3 class="text-h6 mb-2">No results found</h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Try adjusting your search terms or browse all available master data
          </p>
          <v-btn
            variant="outlined"
            @click="search = ''"
            prepend-icon="mdi-refresh"
          >
            Clear Search
          </v-btn>
        </v-card>
      </div>

      <div v-else>
        <v-row>
          <v-col v-for="group in groupedEntities" :key="group.title" cols="12">
            <!-- Group Header -->
            <div class="group-header">
              <div class="d-flex align-center mb-2">
                <v-icon
                  icon="mdi-folder-outline"
                  size="24"
                  color="primary"
                  class="me-3"
                ></v-icon>
                <h3 class="font-weight-semibold text-primary">
                  {{ group.title }}
                </h3>
                <v-spacer></v-spacer>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ group.entities.length }} items
                </v-chip>
              </div>
              <v-divider class="opacity-50"></v-divider>
            </div>

            <!-- Entity Cards -->
            <v-row>
              <v-col
                v-for="entity in group.entities"
                :key="entity.name"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card
                  :to="`/admin/masters/${entity.name}`"
                  class="entity-card h-100"
                  elevation="0"
                  variant="outlined"
                  rounded="lg"
                  hover
                >
                  <v-card-text class="pa-2">
                    <div class="d-flex align-center mb-0">
                      <v-avatar
                        :color="entity.backgroundColor || 'primary'"
                        size="48"
                        class="me-4"
                      >
                        <v-icon
                          :icon="entity.icon"
                          size="24"
                          color="white"
                        ></v-icon>
                      </v-avatar>

                      <div class="flex-grow-1">
                        <h3 class="font-weight-semibold mb-1">
                          {{ entity.title }}
                        </h3>
                        <p
                          v-if="entity.subtitle"
                          class="text-medium-emphasis mb-0"
                        >
                          {{ entity.subtitle }}
                        </p>
                      </div>
                      <v-icon
                        icon="mdi-chevron-right"
                        size="20"
                        color="grey"
                      ></v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
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
.master-settings-page {
  min-height: 100vh;
}

.page-header {
  position: relative;
  padding: 2rem 0;
  background: radial-gradient(
      1200px 400px at 10% -20%,
      rgba(var(--v-theme-primary), 0.12),
      transparent 60%
    ),
    linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.06),
      rgba(0, 0, 0, 0.02)
    );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06),
    inset 0 -1px 0 rgba(var(--v-theme-primary), 0.15);
  overflow: hidden;
  backdrop-filter: saturate(130%) blur(6px);
}

.page-header::before {
  content: "";
  position: absolute;
  top: -30%;
  right: -10%;
  width: 45%;
  height: 140%;
  background: radial-gradient(
    closest-side,
    rgba(var(--v-theme-primary), 0.18),
    transparent 70%
  );
  filter: blur(40px);
  opacity: 0.6;
  transform: rotate(8deg);
  pointer-events: none;
}

.page-header::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--v-theme-primary), 0.6),
    transparent
  );
  background-size: 200% 100%;
  animation: header-shimmer 3.5s linear infinite;
}

@keyframes header-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.page-header h1 {
  letter-spacing: 0.2px;
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-primary)) 60%,
    rgba(0, 0, 0, 0.8) 120%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-header p {
  color: rgba(0, 0, 0, 0.6);
}

.search-field {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.entity-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
}

.entity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.group-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 1rem 0;
  margin: -1rem 0 1rem 0;
}

.loading-section {
  padding: 2rem 0;
}

.empty-state {
  padding: 4rem 0;
}

.cursor-pointer {
  cursor: pointer;
}

.gap-3 {
  gap: 1rem;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .page-header {
    padding: 1.5rem 0;
  }

  .entity-card .v-card-text {
    padding: 1.5rem !important;
  }
}

@media (max-width: 600px) {
  .page-header {
    padding: 1rem 0;
  }

  .entity-card .v-card-text {
    padding: 1rem !important;
  }

  .entity-card .v-avatar {
    width: 40px !important;
    height: 40px !important;
  }
}
</style>