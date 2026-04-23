<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="pb-0">
        <h3>DASHBOARD</h3>
      </v-col>
      <v-col cols="12" md="8">
        <v-row>
          <v-col cols="12" md="6" v-for="item in miniStatistics">
            <v-card elevation="0" rounded="xl">
              <v-card-text>
                <v-avatar
                  class="bg-grey-lighten-5"
                  style="float: right"
                  size="50"
                >
                  <v-icon size="30" color="grey" large>{{ item.icon }}</v-icon>
                </v-avatar>

                <div class="headline text-h4 font-weight-bold">
                  {{ item.value }}
                </div>
                <div>{{ item.title }}</div>
                <div class="text-caption">
                  <span :class="item.percent > 0 ? 'text-green' : 'text-red'"
                    >{{
                      item.percent > 0 ? `+${item.percent}` : `${item.percent}`
                    }}%</span
                  >
                  from last month
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Activity Statistics -->
        <v-row>
          <v-col cols="12">
            <v-card elevation="0" rounded="xl">
              <v-card-title>Activity Statistics</v-card-title>
              <v-card-text>
                <v-img src="/images/barlinechart.svg" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Latest Activities and New Jobs -->
      <v-col cols="12" md="4">
        <!-- Latest Activities -->
        <v-card elevation="0" rounded="xl">
          <v-card-title>Aktifitas Terbaru</v-card-title>
          <v-card-text class="px-0">
            <v-list>
              <!-- Repeat this block for each activity -->
              <template v-for="item in activities" :key="item.title">
                <v-divider></v-divider>
                <v-list-item
                  class="my-2"
                  :subtitle="item.subtitle"
                  :title="item.title"
                >
                  <template v-slot:prepend>
                    <v-avatar color="grey-lighten-4">
                      <v-icon color="grey-darken-1">{{ item.icon }}</v-icon>
                    </v-avatar>
                  </template>

                  <template v-slot:append>
                    <v-btn
                      v-if="item.action"
                      color="grey-lighten-1"
                      icon="mdi-information"
                      variant="text"
                    ></v-btn>
                  </template>
                </v-list-item>
              </template>

              <!-- End repeat -->
            </v-list>
          </v-card-text>
        </v-card>

        <!-- New Jobs -->
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-col cols="12" md="4">
            <v-card elevation="0" rounded="xl">
              <v-card-title>New Candidates</v-card-title>
              <v-card-text class="px-0 pb-0">
                <v-list>
                  <!-- Repeat this block for each activity -->
                  <template v-for="item in candidates" :key="item.title">
                    <v-divider></v-divider>
                    <v-list-item
                      class="my-2"
                      :subtitle="item.subtitle"
                      :title="item.title"
                    >
                      <template v-slot:prepend>
                        <v-avatar color="grey-lighten-4" rounded="lg">
                          <v-img :src="item.photo_url" />
                        </v-avatar>
                      </template>

                      <template v-slot:append>
                        <v-btn
                          v-if="item.action"
                          color="grey-lighten-1"
                          icon="mdi-information"
                          variant="text"
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </template>

                  <!-- End repeat -->
                </v-list>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn block variant="elevated" color="primary" theme="dark"
                  >View More</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card elevation="0" rounded="xl">
              <v-card-title>New Companies</v-card-title>
              <v-card-text class="px-0 pb-0">
                <v-list>
                  <!-- Repeat this block for each activity -->
                  <template v-for="item in companies" :key="item.title">
                    <v-divider></v-divider>
                    <v-list-item
                      class="my-2"
                      :subtitle="item.subtitle"
                      :title="item.title"
                    >
                      <template v-slot:prepend>
                        <v-avatar color="grey-lighten-4" rounded="lg">
                          <v-img :src="item.photo_url" />
                        </v-avatar>
                      </template>

                      <template v-slot:append>
                        <v-btn
                          v-if="item.action"
                          color="grey-lighten-1"
                          icon="mdi-information"
                          variant="text"
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </template>

                  <!-- End repeat -->
                </v-list>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn block variant="elevated" color="primary" theme="dark"
                  >View More</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" rounded="xl">
              <v-card-title>New Jobs</v-card-title>
              <v-card-text class="px-0 pb-0">
                <v-list lines="three">
                  <!-- Repeat this block for each activity -->
                  <template v-for="item in jobs" :key="item.title">
                    <v-divider></v-divider>
                    <v-list-item
                      :subtitle="item.subtitle"
                      :title="item.title"
                      class="py-1"
                    >
                      <template v-slot:subtitle>
                        <a href="#">{{ item.company }}</a
                        ><br />
                        {{ item.subtitle }}
                      </template>
                      <template v-slot:append>
                        <v-avatar rounded="sm" size="60">
                          <v-img :src="item.photo_url" aspect-ratio="1" />
                        </v-avatar>
                      </template>
                    </v-list-item>
                  </template>

                  <!-- End repeat -->
                </v-list>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-btn block variant="elevated" color="primary" theme="dark"
                  >View More</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
// Page meta for layout and middleware
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

const miniStatistics = useState("dashboard-mini-statistics", () => [
  {
    id: 1,
    title: "Total Candidates",
    value: 1597,
    icon: "mdi-account-outline",
    percent: 13,
  },
  {
    id: 2,
    title: "Total Companies",
    value: 377,
    icon: "mdi-domain",
    percent: 34,
  },
  {
    id: 3,
    title: "Match Rates",
    value: "89%",
    icon: "mdi-handshake-outline",
    percent: -8,
  },
  {
    id: 4,
    title: "Active Jobs",
    value: "233",
    icon: "mdi-briefcase-outline",
    percent: 21,
  },
]);

const activities = ref([
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-briefcase",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
  {
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    subtitle: "2 menit yang lalu",
    icon: "mdi-domain",
  },
]);

const candidates = ref([
  {
    title: "Arufa Dhiarma",
    subtitle: "Designer",
    photo_url: "https://picsum.photos/64",
  },
  {
    title: "Arufa Dhiarma",
    subtitle: "Designer",
    photo_url: "https://picsum.photos/64",
  },
]);

const companies = ref([
  {
    title: "Company FULLNAME",
    subtitle: "Jakarta",
    photo_url: "https://picsum.photos/128",
  },
  {
    title: "Company FULLNAME",
    subtitle: "Bandung",
    photo_url: "https://picsum.photos/128",
  },
]);

const jobs = ref([
  {
    title: "Graphic Designer",
    company: "Ruang Guru",
    subtitle: "Jakarta",
    photo_url: "https://picsum.photos/64",
  },
  {
    title: "Fullstack Programmer",
    company: "PT Asenta",
    subtitle: "Bandung",
    photo_url: "https://picsum.photos/64",
  },
]);
</script>
