<template>
  <v-dialog v-model="loadingInitial" persistent width="auto" max-width="200">
    <v-card
      height="130"
      class="d-flex flex-column align-center justify-center text-center mx-auto pa-3"
      rounded="xl"
      style="background-color: rgba(255, 255, 255, 0.9)"
    >
      <v-img :src="`/logo-double.svg`" width="100" class="mb-3" />
      <div class="d-flex align-center justify-center mb-2">
        <v-progress-circular
          size="25"
          width="3"
          indeterminate
          color="primary"
          class="mr-2"
        >
        </v-progress-circular>
        <strong style="font-size: 16px" class="text-primary">
          Loading...
        </strong>
      </div>
    </v-card>
  </v-dialog>
  <div v-if="!loadingInitial">
    <component
      :is="pageDashboardEmployer"
      v-if="['company', 'employer'].includes(me.user_role)"
    ></component>
    <component
      :is="pageDashboardAdmin"
      v-else-if="me.user_role == 'admin'"
    ></component>
    <component
      :is="pageDashboardCandidate"
      v-else
      :key="me.user_role"
    ></component>
  </div>
</template>

<script setup>
// Page meta for layout and middleware
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

const { $apiFetch } = useApi();
const loadingInitial = ref(false);
const { me, fetchMe } = useUser();

import PageDashboardCandidate from "./dashboard-candidate.vue";
import PageDashboardEmployer from "./dashboard-employer.vue";
import PageDashboardAdmin from "./dashboard-admin.vue";
const pageDashboardCandidate = markRaw(PageDashboardCandidate);
const pageDashboardEmployer = markRaw(PageDashboardEmployer);
const pageDashboardAdmin = markRaw(PageDashboardAdmin);

onMounted(async () => {
  loadingInitial.value = true;
  if (!me.value.id) {
    await fetchMe();
  }
  loadingInitial.value = false;
});
</script>
