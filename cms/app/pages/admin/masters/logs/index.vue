<template>
  <v-container fluid>
    <!-- Breadcrumbs -->
    <v-row>
      <v-breadcrumbs
        class="text-caption"
        :items="[
          {
            title: 'Dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'Master Data',
            disabled: false,
            to: '/admin/masters',
          },
          {
            title: 'Logs',
            disabled: true,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <!-- hello -->

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h4 font-weight-bold mb-1">System Logs</h2>
        <p class="text-caption text-medium-emphasis mb-0">
          Monitor and analyze application logs
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-refresh"
        @click="loadLogs"
        :loading="loading"
        rounded="lg"
      >
        Refresh
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card flat rounded="lg" class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Search logs..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              rounded="lg"
              @update:model-value="debouncedSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedTag"
              :items="tagOptions"
              label="Filter by Tag"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadLogs"
              rounded="lg"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="itemsPerPage"
              :items="[10, 25, 50, 100]"
              label="Items per page"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="loadLogs"
              rounded="lg"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-chip color="primary" variant="flat" size="small" class="ml-auto">
              Total: {{ totalItems }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabs -->
    <v-card flat rounded="lg">
      <v-tabs
        v-model="activeTab"
        bg-color="transparent"
        color="primary"
        @update:model-value="handleTabChange"
      >
        <v-tab value="all">
          <v-icon start>mdi-view-list</v-icon>
          All Logs
          <v-chip
            v-if="levelCounts.all > 0"
            size="x-small"
            color="primary"
            class="ml-2"
          >
            {{ levelCounts.all }}
          </v-chip>
        </v-tab>
        <v-tab
          v-for="level in logLevels"
          :key="level.value"
          :value="level.value"
        >
          <v-icon start :color="getLevelColor(level.value)">{{
            getLevelIcon(level.value)
          }}</v-icon>
          {{ level.title }}
          <v-chip
            v-if="levelCounts[level.value] > 0"
            size="x-small"
            :color="getLevelColor(level.value)"
            class="ml-2"
            variant="flat"
          >
            {{ levelCounts[level.value] }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <!-- Loading State -->
      <div v-if="loading" class="pa-8 text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="mt-4 text-body-2 text-medium-emphasis">Loading logs...</p>
      </div>

      <!-- Logs List -->
      <div v-else-if="logs.length === 0" class="pa-8 text-center">
        <v-icon size="64" color="grey-lighten-1" class="mb-2"
          >mdi-file-document-outline</v-icon
        >
        <p class="text-body-1 text-medium-emphasis">No logs found</p>
      </div>

      <v-list v-else lines="two" class="pa-0">
        <template v-for="(log, index) in logs" :key="log.id">
          <v-list-item
            @click="openLogDetail(log)"
            class="log-item"
            :class="getLevelColorClass(log.level)"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getLevelColor(log.level)"
                size="40"
                class="mr-4"
              >
                <v-icon :color="getLevelIconColor(log.level)" size="20">
                  {{ getLevelIcon(log.level) }}
                </v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="d-flex align-center mb-1">
              <span class="font-weight-medium" style="font-size: 12px">{{
                log.message
              }}</span>
              <v-chip
                :color="getLevelColor(log.level)"
                size="x-small"
                class="ml-2"
                variant="flat"
              >
                {{ log.level.toUpperCase() }}
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              <div class="d-flex align-center flex-wrap gap-2 mt-1">
                <v-chip
                  size="x-small"
                  variant="outlined"
                  color="primary"
                  prepend-icon="mdi-tag"
                >
                  {{ log.tags }}
                </v-chip>
                <span class="text-caption text-medium-emphasis">
                  <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
                  {{ formatDate(log.created_at) }}
                </span>
                <span
                  v-if="log.meta && Object.keys(log.meta).length > 0"
                  class="text-caption text-medium-emphasis"
                >
                  <v-icon size="12" class="mr-1">mdi-information</v-icon>
                  Has metadata
                </span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-chevron-right"
                variant="text"
                size="small"
                @click.stop="openLogDetail(log)"
              ></v-btn>
            </template>
          </v-list-item>
          <v-divider v-if="index < logs.length - 1"></v-divider>
        </template>
      </v-list>

      <!-- Pagination -->
      <v-card-actions v-if="!loading && logs.length > 0" class="pa-4">
        <v-spacer></v-spacer>
        <div class="d-flex align-center gap-4">
          <span class="text-caption text-medium-emphasis">
            Page {{ currentPage }} of {{ totalPages || 1 }} ({{ totalItems }}
            total)
          </span>
          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="loadLogs"
          ></v-pagination>
          <span v-else class="text-caption text-medium-emphasis">
            Showing all {{ totalItems }} logs
          </span>
        </div>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <!-- Log Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="800" scrollable>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar
              :color="getLevelColor(selectedLog?.level)"
              size="40"
              class="mr-3"
            >
              <v-icon :color="getLevelIconColor(selectedLog?.level)" size="20">
                {{ getLevelIcon(selectedLog?.level) }}
              </v-icon>
            </v-avatar>
            <span class="text-h6">Log Details</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="detailDialog = false">
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-row v-if="selectedLog">
            <!-- Level & Tags -->
            <v-col cols="12">
              <div class="d-flex gap-2 flex-wrap mb-4">
                <v-chip
                  :color="getLevelColor(selectedLog.level)"
                  size="small"
                  variant="flat"
                  prepend-icon="mdi-alert-circle"
                >
                  {{ selectedLog.level.toUpperCase() }}
                </v-chip>
                <v-chip
                  size="small"
                  variant="outlined"
                  color="primary"
                  prepend-icon="mdi-tag"
                >
                  {{ selectedLog.tags }}
                </v-chip>
              </div>
            </v-col>

            <!-- Message -->
            <v-col cols="12">
              <v-textarea
                :model-value="selectedLog.message"
                label="Message"
                variant="outlined"
                readonly
                auto-grow
                rows="3"
                density="compact"
              ></v-textarea>
            </v-col>

            <!-- Timestamp -->
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="formatDate(selectedLog.created_at)"
                label="Created At"
                variant="outlined"
                readonly
                prepend-inner-icon="mdi-clock-outline"
                density="compact"
              ></v-text-field>
            </v-col>

            <!-- ID -->
            <v-col cols="12" md="6">
              <v-text-field
                :model-value="selectedLog.id"
                label="Log ID"
                variant="outlined"
                readonly
                prepend-inner-icon="mdi-identifier"
                density="compact"
              ></v-text-field>
            </v-col>

            <!-- Meta Data -->
            <v-col cols="12" v-if="selectedLog.meta">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-subtitle-1 pa-0 mb-3">
                  <v-icon class="mr-2">mdi-code-json</v-icon>
                  Metadata
                </v-card-title>
                <pre
                  class="meta-json"
                  v-html="formatJson(selectedLog.meta)"
                ></pre>
              </v-card>
            </v-col>

            <!-- Empty Meta -->
            <v-col cols="12" v-else>
              <v-alert type="info" variant="tonal" class="mb-0">
                No metadata available for this log entry.
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="detailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["auth"],
});

import { ref, computed, onMounted, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { debounce } from "~/utils/debounce";

const { $apiFetch } = useApi();

// State
const logs = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const selectedTag = ref(null);
const activeTab = ref("all");
const currentPage = ref(1);
const itemsPerPage = ref(25);
const totalItems = ref(0);
const totalPages = ref(0);
const detailDialog = ref(false);
const selectedLog = ref(null);
const tagOptions = ref([]);
const levelCounts = ref({});

// Log levels for tabs
const logLevels = [
  { title: "Info", value: "info" },
  { title: "Warn", value: "warn" },
  { title: "Error", value: "error" },
  { title: "Fatal", value: "fatal" },
];

// Load logs from API
const loadLogs = async () => {
  loading.value = true;
  try {
    const filters = {};

    // Add search filter (using orWhere pattern like other pages)
    if (searchQuery.value) {
      filters.message = searchQuery.value;
      filters.tags = searchQuery.value;
      filters.orWhere = ["message", "tags"];
    }

    // Add tag filter
    if (selectedTag.value) {
      filters.tags = selectedTag.value;
      // Remove orWhere if we're filtering by specific tag
      if (filters.orWhere) {
        delete filters.orWhere;
        delete filters.message;
      }
    }

    // Add level filter based on active tab
    if (activeTab.value !== "all") {
      filters.level = activeTab.value;
    }

    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      filters: filters,
      sortBy: { created_at: "DESC" },
    };

    const response = await $apiFetch("/logs/search", {
      method: "GET",
      params: params,
    });

    // Support both 'data' and 'items' response formats
    logs.value = response.data || response.items || [];

    // Support multiple response formats for pagination
    totalItems.value =
      response.meta?.total ||
      response.total ||
      response.count ||
      logs.value.length;
    const calculatedTotalPages =
      response.meta?.totalPages ||
      Math.ceil(totalItems.value / itemsPerPage.value);
    totalPages.value = calculatedTotalPages > 0 ? calculatedTotalPages : 1;

    // Extract unique tags from logs for filter dropdown
    const uniqueTags = new Set();
    logs.value.forEach((log) => {
      if (log.tags) {
        uniqueTags.add(log.tags);
      }
    });
    tagOptions.value = Array.from(uniqueTags)
      .sort()
      .map((tag) => ({
        title: tag,
        value: tag,
      }));

    // Count logs per level
    updateLevelCounts();
  } catch (error) {
    console.error("Error loading logs:", error);
  } finally {
    loading.value = false;
  }
};

// Update level counts
const updateLevelCounts = async () => {
  try {
    // Load all logs to count levels (or use a separate endpoint if available)
    const response = await $apiFetch("/logs/search", {
      method: "GET",
      params: {
        page: 1,
        limit: 1000, // Get more to count accurately
        sortBy: { created_at: "DESC" },
      },
    });

    // Support both 'data' and 'items' response formats
    const allLogs = response.data || response.items || [];
    const counts = {
      all: allLogs.length,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };

    allLogs.forEach((log) => {
      const level = log.level?.toLowerCase();
      if (level && counts.hasOwnProperty(level)) {
        counts[level] = (counts[level] || 0) + 1;
      }
    });

    levelCounts.value = counts;
  } catch (error) {
    console.error("Error updating level counts:", error);
  }
};

// Handle tab change
const handleTabChange = () => {
  currentPage.value = 1;
  loadLogs();
};

// Debounced search
const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  loadLogs();
}, 500);

// Open log detail dialog
const openLogDetail = (log) => {
  selectedLog.value = log;
  detailDialog.value = true;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Format JSON with syntax highlighting
const formatJson = (obj) => {
  if (!obj) return "";
  const jsonString = JSON.stringify(obj, null, 2);
  // Simple syntax highlighting
  return jsonString
    .replace(/(".*?"):/g, '<span style="color: #0d7377;">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span style="color: #14a085;">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span style="color: #a78bfa;">$1</span>')
    .replace(
      /:\s*(true|false|null)/g,
      ': <span style="color: #f59e0b;">$1</span>'
    );
};

// Get level color
const getLevelColor = (level) => {
  const colors = {
    info: "blue",
    warn: "orange",
    error: "red",
    fatal: "purple",
    debug: "grey",
    verbose: "grey",
  };
  return colors[level?.toLowerCase()] || "grey";
};

// Get level icon color
const getLevelIconColor = (level) => {
  return "white";
};

// Get level icon
const getLevelIcon = (level) => {
  const icons = {
    info: "mdi-information",
    warn: "mdi-alert",
    error: "mdi-alert-circle",
    fatal: "mdi-alert-octagon",
    debug: "mdi-bug",
    verbose: "mdi-message-text",
  };
  return icons[level?.toLowerCase()] || "mdi-information";
};

// Get level color class
const getLevelColorClass = (level) => {
  const classes = {
    info: "log-item-info",
    warn: "log-item-warn",
    error: "log-item-error",
    fatal: "log-item-fatal",
  };
  return classes[level?.toLowerCase()] || "";
};

// Watch for pagination changes
watch([currentPage, itemsPerPage], () => {
  loadLogs();
});

// Load on mount
onMounted(() => {
  loadLogs();
  updateLevelCounts();
});
</script>

<style scoped>
.log-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.log-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.log-item-info:hover {
  background-color: rgba(33, 150, 243, 0.05);
}

.log-item-warn:hover {
  background-color: rgba(255, 152, 0, 0.05);
}

.log-item-error:hover {
  background-color: rgba(244, 67, 54, 0.05);
}

.log-item-fatal:hover {
  background-color: rgba(156, 39, 176, 0.05);
}

.meta-json {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.gap-2 {
  gap: 8px;
}
</style>
