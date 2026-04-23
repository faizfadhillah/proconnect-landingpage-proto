<template>
  <div
    v-if="isVerified"
    class="verified-badge d-inline-flex align-center"
    :class="{
      'verified-badge-light': light,
      'verified-badge-icon-only': justIcon,
    }"
  >
    <v-icon
      :size="justIcon ? 18 : 16"
      :class="justIcon ? '' : 'mr-1'"
      :style="light ? 'color: #ffffff' : 'color: #e8a034'"
    >
      mdi-shield-check
    </v-icon>
    <span
      v-if="!justIcon"
      class="verified-text"
      :class="{ 'verified-text-light': light }"
    >
      Verified
    </span>
  </div>
</template>

<script setup>
defineProps({
  isVerified: {
    type: Boolean,
    default: false,
  },
  light: {
    type: Boolean,
    default: false,
  },
  justIcon: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.verified-badge {
  padding: 2px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background-color: #fafafa;
  font-size: 12px;
  line-height: 1.2;
}

.verified-badge-light {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.verified-badge-icon-only {
  padding: 0;
  border: none;
  background-color: transparent;
}

.verified-text {
  color: #616161;
  font-weight: 500;
}

.verified-text-light {
  color: #ffffff;
}

:deep(.v-icon) {
  filter: drop-shadow(0 1px 1px rgba(232, 160, 52, 0.3));
}
</style>
