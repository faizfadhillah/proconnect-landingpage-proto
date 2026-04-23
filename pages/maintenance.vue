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
          ProConnect Sedang Dalam Perawatan
        </h1>
        <p class="text-body-1 mb-6">
          Kami sedang melakukan maintenance untuk meningkatkan kualitas layanan ProConnect.
          Silakan kembali lagi beberapa saat lagi.
        </p>
        <p class="text-caption text-medium-emphasis">
          Terima kasih atas pengertiannya.
        </p>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb, #e4ebff);
}
</style>

