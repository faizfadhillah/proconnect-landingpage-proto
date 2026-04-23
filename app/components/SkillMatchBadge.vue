<template>
  <div class="d-flex align-center gap-2" :class="containerClass">
    <v-chip
      v-if="isInternal"
      size="small"
      color="success"
      variant="flat"
      class="text-white"
    >
      Internal
    </v-chip>
    <v-chip
      v-if="skillMatch !== undefined && skillMatch !== null"
      size="small"
      variant="outlined"
      class="skill-match-badge"
      :class="{ 'cursor-pointer': clickable }"
      @click.stop.prevent="handleClick"
    >
      <v-icon
        v-if="
          skillMatch !== -1 && skillMatch !== null && skillMatch !== undefined
        "
        size="14"
        class="mr-1 skill-match-icon"
        >mdi-shield-check</v-icon
      >
      {{ formatSkillMatchText(skillMatch) }}
    </v-chip>
  </div>
</template>

<script setup>
const props = defineProps({
  skillMatch: {
    type: Number,
    default: null,
  },
  isInternal: {
    type: Boolean,
    default: false,
  },
  containerClass: {
    type: String,
    default: "mb-1",
  },
  clickable: {
    type: Boolean,
    default: false,
  },
  jobId: {
    type: String,
    default: null,
  },
  userId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["click"]);

const formatSkillMatchText = (skillMatch) => {
  if (skillMatch === -1 || skillMatch === null || skillMatch === undefined) {
    return "Skills not specified";
  }
  return `${skillMatch.toFixed(0)}% Skill Match`;
};

const handleClick = (event) => {
  if (props.clickable && props.jobId && props.userId) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    emit("click", {
      jobId: props.jobId,
      userId: props.userId,
    });
  }
};
</script>

<style scoped>
.skill-match-badge {
  background-color: #ffffff !important;
  color: #1976d2 !important;
  border: 1px solid #e0e0e0 !important;
  font-size: 12px !important;
  height: 27px !important;
  padding: 0 8px !important;
}

.skill-match-badge.cursor-pointer {
  cursor: pointer;
}

.skill-match-badge.cursor-pointer:hover {
  background-color: #f5f5f5 !important;
}

.skill-match-badge .skill-match-icon {
  color: #ffb300 !important;
}
</style>
