<template></template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

const router = useRouter();
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  if (me.value.user_role == "employer") {
    router.push("/admin/jobs/employer");
  } else {
    router.push("/admin/jobs/all");
  }
});
</script>
<style></style>
