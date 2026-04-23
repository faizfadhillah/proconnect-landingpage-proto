<template>
  <div>
    <component
      v-if="['employer', 'company', 'admin'].includes(me.user_role)"
      :is="Employer"
    />
    <component v-else-if="me.user_role == 'candidate'" :is="Candidate" />
  </div>
</template>
<script setup>
import Employer from "./employer/index.vue";
import Candidate from "./candidate/index.vue";

definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

const { me, fetchMe } = useUser();
onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
});
</script>
