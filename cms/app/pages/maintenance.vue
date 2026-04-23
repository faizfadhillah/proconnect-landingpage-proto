<template>
  <v-app theme="light">
    <v-main class="d-flex align-center justify-center maintenance-page">
      <v-container class="text-center" max-width="600">
        <v-icon
          color="primary"
          size="88"
          class="mb-4"
        >
          mdi-tools
        </v-icon>
        <h1 class="text-h4 font-weight-bold mb-2">
          ProConnect is Under Maintenance
        </h1>
        <p class="text-body-1 mb-4">
          We are currently performing scheduled maintenance to improve the ProConnect experience.
        </p>

        <div v-if="hasCountdown" class="mb-4">
          <p class="text-body-2 text-medium-emphasis mb-1">
            Estimated time until maintenance is completed:
          </p>
          <div class="text-h5 font-weight-bold">
            {{ countdownHours }}:{{ countdownMinutes }}:{{ countdownSeconds }}
          </div>
        </div>

        <v-btn
          v-if="isExpired"
          color="primary"
          class="mb-4"
          @click="goHome"
        >
          Back to Home
        </v-btn>

        <p class="text-caption text-medium-emphasis">
          Thank you for your understanding and patience.
        </p>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const config = useRuntimeConfig();
const endAtRaw = config.public?.MAINTENANCE_END_AT as string | undefined;

const endAt = computed<Date | null>(() => {
  if (!endAtRaw) return null;
  const trimmed = endAtRaw.trim();
  if (!trimmed) return null;

  // Format: "YYYY-MM-DD HH:mm" → convert to ISO with Asia/Jakarta offset
  const iso = trimmed.replace(" ", "T") + "+07:00";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
});

const remainingSeconds = ref<number | null>(null);

const hasCountdown = computed(
  () => remainingSeconds.value !== null && remainingSeconds.value > 0
);

const isExpired = computed(
  () => endAt.value !== null && remainingSeconds.value === 0
);

const countdownHours = computed(() => {
  if (!hasCountdown.value) return "00";
  const total = remainingSeconds.value as number;
  const hours = Math.floor(total / 3600);
  return String(hours).padStart(2, "0");
});

const countdownMinutes = computed(() => {
  if (!hasCountdown.value) return "00";
  const total = remainingSeconds.value as number;
  const minutes = Math.floor((total % 3600) / 60);
  return String(minutes).padStart(2, "0");
});

const countdownSeconds = computed(() => {
  if (!hasCountdown.value) return "00";
  const total = remainingSeconds.value as number;
  const seconds = total % 60;
  return String(seconds).padStart(2, "0");
});

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!endAt.value) return;

  const update = () => {
    const now = new Date();
    const diffMs = endAt.value!.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    remainingSeconds.value = diffSec > 0 ? diffSec : 0;
    if (diffSec <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  update();
  timer = setInterval(update, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
  }
});

const goHome = () => {
  navigateTo("/");
};

watch(isExpired, (val) => {
  if (val) {
    navigateTo("/");
  }
});
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb, #e4ebff);
}
</style>

