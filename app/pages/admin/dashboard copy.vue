// pages/dashboard.vue
<template>
  <v-container>
    <!-- Statistics Cards -->
    <v-row>
      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-1 mb-1">Total Talenta</div>
                <div class="text-h4">{{ stats.totalTalents }}</div>
              </div>
              <v-icon size="48" color="primary">mdi-account-group</v-icon>
            </div>
            <v-progress-linear
              :model-value="stats.talentGrowth"
              color="primary"
              height="4"
              class="mt-2"
            ></v-progress-linear>
            <div class="text-caption mt-1">
              +{{ stats.talentGrowth }}% dari bulan lalu
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-1 mb-1">Total Perusahaan</div>
                <div class="text-h4">{{ stats.totalCompanies }}</div>
              </div>
              <v-icon size="48" color="success">mdi-office-building</v-icon>
            </div>
            <v-progress-linear
              :model-value="stats.companyGrowth"
              color="success"
              height="4"
              class="mt-2"
            ></v-progress-linear>
            <div class="text-caption mt-1">
              +{{ stats.companyGrowth }}% dari bulan lalu
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-1 mb-1">Match Rate</div>
                <div class="text-h4">{{ stats.matchRate }}%</div>
              </div>
              <v-icon size="48" color="info">mdi-handshake</v-icon>
            </div>
            <v-progress-linear
              :model-value="stats.matchRate"
              color="info"
              height="4"
              class="mt-2"
            ></v-progress-linear>
            <div class="text-caption mt-1">Tingkat keberhasilan matching</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-1 mb-1">Active Jobs</div>
                <div class="text-h4">{{ stats.activeJobs }}</div>
              </div>
              <v-icon size="48" color="warning">mdi-briefcase</v-icon>
            </div>
            <v-progress-linear
              :model-value="stats.jobGrowth"
              color="warning"
              height="4"
              class="mt-2"
            ></v-progress-linear>
            <div class="text-caption mt-1">
              +{{ stats.jobGrowth }}% dari bulan lalu
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activities and Charts -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="2" class="mb-6" height="500">
          <v-card-title class="d-flex align-center">
            <v-icon size="24" color="primary" class="me-2"
              >mdi-chart-line</v-icon
            >
            Statistik Aktivitas
          </v-card-title>
          <v-card-text> </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon size="24" color="primary" class="me-2"
              >mdi-clock-outline</v-icon
            >
            Aktivitas Terbaru
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :subtitle="activity.date"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="36">
                    <v-icon color="white" size="20">{{ activity.icon }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// Page meta for layout and middleware
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

// Dashboard data
const stats = ref({
  totalTalents: 1500,
  talentGrowth: 12,
  totalCompanies: 300,
  companyGrowth: 8,
  matchRate: 85,
  activeJobs: 450,
  jobGrowth: 15,
});

const recentActivities = ref([
  {
    id: 1,
    title: "Talenta baru terdaftar dari Indonesia",
    date: "2 menit yang lalu",
    icon: "mdi-account- Plus",
  },
  {
    id: 2,
    title: "Perusahaan baru bergabung dari Singapura",
    date: "5 menit yang lalu",
    icon: "mdi-office-building",
  },
  {
    id: 3,
    title: "Talenta dihubungkan dengan perusahaan di Malaysia",
    date: "10 menit yang lalu",
    icon: "mdi-handshake",
  },
]);

const chartOption = ref({
  title: {
    text: "Statistik Aktivitas",
    left: "center",
  },
  tooltip: {
    trigger: "axis",
  },
  legend: {
    data: ["Talenta", "Perusahaan", "Match Rate"],
    left: "right",
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: [
    {
      type: "category",
      data: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    },
  ],
  yAxis: [
    {
      type: "value",
    },
  ],
  series: [
    {
      name: "Talenta",
      type: "line",
      data: [120, 132, 101, 134, 90, 230, 210, 120, 132, 101, 134, 90],
    },
    {
      name: "Perusahaan",
      type: "line",
      data: [220, 182, 191, 234, 290, 330, 310, 220, 182, 191, 234, 290],
    },
    {
      name: "Match Rate",
      type: "line",
      data: [150, 232, 201, 154, 190, 330, 410, 150, 232, 201, 154, 190],
    },
  ],
});
</script>

<style scoped>
.chart {
  height: 300px;
}
</style>
