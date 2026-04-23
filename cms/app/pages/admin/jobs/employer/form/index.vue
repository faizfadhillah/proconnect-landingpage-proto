<template>
  <div>
    <component :is="CreateJob" />
  </div>
</template>
<script setup>
import CreateJob from "./[id]/1.vue";

definePageMeta({
  ssr: false,
  layout: "wizard-job",
  middleware: ["auth", "employer-jobs"],
});

const route = useRoute();
const router = useRouter();
onMounted(() => {
  if (route.query.id) {
    router.replace(`/admin/jobs/employer/form/${route.query.id}/1`);
  }
});
</script>
