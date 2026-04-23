<template>
  <v-app-bar density="comfortable" class="px-2" elevation="0">
    <v-row class="align-center px-3" style="min-width: 220px">
      <v-btn
        icon
        size="small"
        @click="handleBack"
        elevation="0"
        color="primary"
        class="mr-2"
        style="background: rgba(255, 255, 255, 0.1)"
      >
        <v-icon size="20">mdi-arrow-left</v-icon>
      </v-btn>
      <v-img src="/logo.svg" height="24"></v-img>
    </v-row>
    <v-spacer style="width: 80%"></v-spacer>
  </v-app-bar>
  <v-divider></v-divider>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <h2>Choose Your Role</h2>
        <p>Please select one from below:</p>
      </v-col>
      <v-col cols="12">
        <v-row justify="center">
          <v-col cols="12" xl="3" md="4" sm="6">
            <v-card
              @click="setRole('candidate')"
              :loading="loading['candidate']"
              :disabled="disabledButton"
              :class="{ 'bg-grey-lighten-2': disabledButton }"
              rounded="lg"
            >
              <v-img height="150" cover src="/images/candidate.jpeg">
                <v-progress-circular
                  v-if="loading['candidate']"
                  color="primary"
                  indeterminate
                  size="100"
                  width="10"
                  class="mt-5"
                ></v-progress-circular>
              </v-img>
              <v-card-text class="px-2">
                <h3 class="mb-2 text-primary">Candidate</h3>
                <p>
                  Fresh graduate, mid-level employee, or an expert level
                  currently looking for a new opportunity
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" xl="3" md="4" sm="6">
            <v-card
              @click="setRole('company')"
              :loading="loading['company']"
              :disabled="disabledButton"
              :class="{ 'bg-grey-lighten-2': disabledButton }"
              rounded="lg"
            >
              <v-img height="150" cover src="/images/employer.jpeg">
                <v-progress-circular
                  v-if="loading['company']"
                  color="primary"
                  indeterminate
                  size="100"
                  width="10"
                  class="mt-5"
                ></v-progress-circular>
              </v-img>
              <v-card-text class="px-5">
                <h3 class="mb-2 text-primary">Employer</h3>
                <p>
                  HR Department or Company owner who seeks professional
                  expertise to expand their business
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
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
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  middleware: ["auth"],
});
const { $apiFetch } = useApi();
const router = useRouter();
const loading = ref({
  candidate: false,
  company: false,
});

const stepItems = ref([]);
const fetchStepItems = async (role = "candidate") => {
  const data =
    role == "candidate"
      ? await $apiFetch("/configs/key/list_of_wizard_candidate")
      : await $apiFetch("/configs/key/list_of_wizard_employer_v2");
  stepItems.value = data.value;
  me.value.wizard_state =
    role == "candidate"
      ? stepItems.value
      : stepItems.value.filter((item) => item.roles.includes("owner_hq"));
  me.last_wizard_state = 1;
};

const { me, fetchMe } = useUser();

const setRole = async (drole) => {
  loading.value[drole] = true;
  me.value.user_role = drole;
  await fetchStepItems(drole);

  const body = {
    user_role: me.value.user_role,
    company_role: me.value.company_role || "owner_hq",
    wizard_state: me.value.wizard_state,
    last_wizard_state: 1,
  };
  if (drole == "company") {
    /*body.assignments = [
      {
        company_hq_id: null,
        company_id: null,
        company_role: "owner_hq",
        status: "active",
        employment_type: "Full-time",
        user_id: me.value.id,
        start_date: "2025-01-01",
        end_date: "2025-12-31",
        role: "employer",
      },
    ];*/
  } else {
    me.value.company_role = null;
  }
  $apiFetch(`/users/${me.value.id}`, {
    method: "PATCH",
    body,
  })
    .then((data) => {
      router.push(`/admin/profile/${drole}/1`);
    })
    .finally(() => {
      loading.value[drole] = false;
    });
};

const getProfile = async () => {
  await fetchMe();
  if (!me.value.user_role) {
    router.push("/admin/profile/choose-role");
  }
};

const dialog = useDialogStore();
const handleBack = async () => {
  try {
    await dialog.openDialog({
      title: "Are you sure?",
      message: "Are you sure you want to leave this page?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "error",
      cancelButtonColor: "grey-darken-1",
    });
    router.replace("/login");
  } catch (error) {
    console.log(error);
  }
};

const disabledButton = ref(true);
const snackbar = useSnackbarStore();
const loadingInitial = ref(true);
onMounted(async () => {
  if (!me.value.id) {
    await getProfile();
  }
  if (
    ["company", "employer"].includes(me.value.user_role) &&
    me.value.last_wizard_state > 2 &&
    me.value.last_wizard_state <= me.value.wizard_state.length
  ) {
    snackbar.showSnackbar({
      message: `You have already completed the required steps. Redirecting to the next step...`,
      color: "warning",
    });
    disabledButton.value = true;
    setTimeout(() => {
      router.replace(`/admin/profile/employer/${me.value.last_wizard_state}`);
    }, 3000);
  } else {
    disabledButton.value = false;
  }

  loadingInitial.value = false;
});
</script>
