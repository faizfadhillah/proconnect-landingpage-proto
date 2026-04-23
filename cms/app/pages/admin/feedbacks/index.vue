<template>
  <div>
    <component :is="PageFeedbackList" v-if="me.user_role === 'admin'" />
    <component
      :is="PageFeedbackForm"
      v-else-if="['candidate', 'company'].includes(me.user_role)"
    />
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
import PageFeedbackList from "./list.vue";
import PageFeedbackForm from "./form.vue";
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();
onMounted(async () => {
  if (me.value.full_name == "") {
    await fetchMe();
  }
});
</script>
