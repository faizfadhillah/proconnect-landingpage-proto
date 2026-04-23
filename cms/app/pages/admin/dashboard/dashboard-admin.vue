<template>
  <v-container>
    <v-row style="max-width: 1000px; margin: 0 auto">
      <v-col cols="12">
        <div class="text-center">
          <h3>Hello {{ me.full_name }}</h3>
          <p style="font-size: 1.2rem">Get Started Finding Candidates Here!</p>
        </div>
        <v-text-field
          v-model="search"
          placeholder="Find Candidate Here"
          append-inner-icon="mdi-magnify"
          class="my-4 bg-white"
          variant="outlined"
          hide-details
          rounded="lg"
          density="comfortable"
          @keyup.enter.prevent="searchCandidates"
          @keyup="searchCandidates"
          elevation="0"
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <div>
          <h3 class="mb-5">What do you want to do today?</h3>
          <v-row>
            <v-col cols="12" md="4">
              <v-card
                to="/admin/companies"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0; min-height: 105px"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-domain</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Manage Companies</h3>
                    <div class="text-caption text-grey">
                      View and Manage All Registered Companies
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card
                to="/admin/approvals/skill-passports"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0; min-height: 105px"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-certificate</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Manage Skill Passport</h3>
                    <div class="text-caption text-grey">
                      View and Manage All Skill Passport
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card
                to="/admin/feedbacks"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0; min-height: 105px"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-comment-quote-outline</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Manage Feedbacks</h3>
                    <div class="text-caption text-grey">
                      View and Manage All Feedbacks
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const router = useRouter();
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();

onMounted(async () => {
  if (me.value.full_name == "") {
    await fetchMe();
  }
});

const search = ref("");
const searchCandidates = debounce(async () => {
  router.push(`/admin/candidates?search=${search.value}`);
}, 500);
</script>
<style scoped>
.vertical-stepper {
  position: relative;
}

.stepper-item {
  position: relative;
  z-index: 1;
}

.stepper-circle {
  background: white;
  position: relative;
  z-index: 2;
}

.stepper-line {
  position: absolute;
  left: 28px; /* Adjust this value to align with the center of the circle */
  top: 50px; /* Adjust to start from bottom of circle */
  width: 1px;
  height: 30px; /* Adjust height as needed */
  background-color: #bbb;
}

.stepper-line-active {
  background-color: #1560bd;
}
</style>
