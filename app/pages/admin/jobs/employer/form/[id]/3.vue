<template>
  <v-container fluid>
    <v-btn
      v-if="selectedJob.status == 'DRAFT'"
      color="primary"
      variant="outlined"
      @click="saveCurrentStatus"
      :loading="loadingAsDraft"
      width="140"
      rounded="lg"
      height="42"
      style="position: fixed; top: 8px; right: 20px; z-index: 1998"
    >
      Save as draft
    </v-btn>
    <v-btn
      v-else-if="selectedJob.status == 'PUBLISH'"
      color="primary"
      variant="outlined"
      @click="saveCurrentStatus"
      :loading="loadingAsDraft"
      width="220"
      rounded="lg"
      height="42"
      style="position: fixed; top: 8px; right: 20px; z-index: 1998"
    >
      Save & Update Changes
    </v-btn>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="12" md="10" lg="8">
        <v-card rounded="lg" elevation="0">
          <v-card-text>
            <h2 class="font-weight-bold mb-2">Review & Publish</h2>
            <div class="text-grey mb-6">
              This is what your candidates will see
            </div>

            <!-- Recruitment Stages List -->

            <!-- Add Stage -->
            <div>
              <div class="d-flex align-center justify-center mb-4">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="prevTab"
                  :disabled="activeTab == 0"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <div class="text-h6 font-weight-bold mx-8">
                  {{ tabTitles[activeTab] }}
                </div>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="nextTab"
                  :disabled="activeTab == tabTitles.length - 1"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
              </div>
              <v-window v-model="activeTab">
                <v-window-item value="1">
                  <div>
                    <div class="d-flex justify-end">
                      <v-btn
                        color="primary"
                        variant="text"
                        class="mb-2 px-0"
                        @click="handleEdit(1)"
                      >
                        Edit
                      </v-btn>
                    </div>
                    <v-card
                      elevation="0"
                      rounded="lg"
                      style="border: 1px solid #e0e0e0"
                    >
                      <v-skeleton-loader
                        v-if="jobLoading"
                        type="list-item-avatar-two-line"
                      ></v-skeleton-loader>
                      <template v-if="selectedJob">
                        <v-list style="min-height: 120px">
                          <v-list-item class="pb-2">
                            <template v-slot:append>
                              <v-list-item-action>
                                <v-avatar
                                  size="60"
                                  rounded="lg"
                                  class="ml-4 bg-grey-lighten-2"
                                >
                                  <v-img
                                    v-if="selectedJob.company?.logo_url"
                                    :src="
                                      BASE_URL + selectedJob.company?.logo_url
                                    "
                                    cover
                                  ></v-img>
                                  <v-icon size="40" color="grey" v-else>
                                    mdi-briefcase-outline
                                  </v-icon>
                                </v-avatar>
                              </v-list-item-action>
                            </template>
                            <v-list-item-title class="font-weight-bold">{{
                              selectedJob.title
                            }}</v-list-item-title>

                            <div>
                              <div>
                                <span class="text-caption text-primary">
                                  {{ selectedJob.company?.brand_name }}
                                  <template v-if="selectedJob.company?.branch">
                                    ({{ selectedJob.company?.branch }})
                                  </template>
                                </span>
                                <template
                                  v-if="
                                    (selectedJob.is_outside_indo &&
                                      selectedJob.other_region) ||
                                    (!selectedJob.is_outside_indo &&
                                      selectedJob.region?.name)
                                  "
                                >
                                  <span class="text-grey-darken-2 mx-1">•</span>
                                  <span class="text-caption text-grey-darken-2">
                                    {{
                                      selectedJob.is_outside_indo
                                        ? selectedJob.other_region
                                        : selectedJob.region?.name
                                    }}
                                  </span>
                                </template>
                              </div>
                              <div
                                style="font-size: 12px"
                                v-if="
                                  selectedJob.min_salary ||
                                  selectedJob.max_salary
                                "
                              >
                                {{
                                  selectedJob.salary_country?.currency_code ||
                                  "IDR"
                                }}
                                {{ formatNumber(selectedJob.min_salary) }} -
                                {{
                                  selectedJob.salary_country?.currency_code ||
                                  "IDR"
                                }}
                                {{ formatNumber(selectedJob.max_salary) }} per
                                month
                              </div>
                              <div>
                                <span class="text-caption text-grey-darken-2">{{
                                  formatTimeAgo(selectedJob.updated_at)
                                }}</span>
                              </div>
                            </div>
                          </v-list-item>
                        </v-list>
                        <v-card-text class="pt-0 px-4 text-caption">
                          <div class="mb-2">
                            <v-chip
                              class="mr-2"
                              label
                              size="small"
                              v-for="s in selectedJob.domicile_status?.filter(
                                (s) => s !== null
                              )"
                              :key="s"
                            >
                              {{
                                domicileStatuses.find((e) => e.name === s)
                                  ?.label || s
                              }}
                            </v-chip>
                            <v-chip
                              class="mr-2"
                              label
                              size="small"
                              v-for="s in selectedJob.employment_status?.filter(
                                (s) => s !== null
                              )"
                              :key="s"
                            >
                              {{
                                employmentStatuses.find((e) => e.name === s)
                                  ?.label || s
                              }}
                            </v-chip>
                          </div>

                          <!-- Job Details -->
                          <div class="job-details">
                            <h3 class="text-title mb-3">Job Description</h3>

                            <rich-text-view v-model="selectedJob.description" />

                            <h3 class="text-title mb-2">Right To Work</h3>
                            <div class="mb-6">
                              <ul class="ml-4">
                                <li
                                  v-for="rtw in selectedJob.right_to_works ||
                                  []"
                                  :key="rtw.id"
                                >
                                  {{ rtw.salary_country?.country_name }} -
                                  {{ rtw.name }}
                                </li>
                              </ul>
                              <span
                                class="text-caption"
                                v-if="selectedJob.right_to_works?.length === 0"
                                >Not specified</span
                              >
                            </div>
                            <h3 class="text-title mb-2">Location</h3>
                            <div class="mb-6">
                              <template v-if="selectedJob.is_outside_indo">
                                {{ selectedJob.other_city }}
                                {{ selectedJob.other_country }}
                              </template>
                              <template v-else>
                                {{ selectedJob.region?.name }} INDONESIA
                              </template>
                            </div>

                            <div class="mb-6">
                              <h3 class="text-title font-weight-bold mb-2">
                                Job Skills
                              </h3>
                              <v-chip
                                v-for="skill in selectedJob.skills"
                                :key="skill.id"
                                variant="tonal"
                                size="small"
                                label
                                class="mr-1 mb-1"
                              >
                                {{ skill.name }}
                              </v-chip>

                              <span
                                class="text-caption"
                                v-if="
                                  selectedJob.skills?.length === 0 ||
                                  !selectedJob.skills
                                "
                                >Not specified</span
                              >
                            </div>

                            <div class="mb-6">
                              <h3 class="text-title font-weight-bold mb-2">
                                Interest
                              </h3>
                              <v-chip
                                v-for="interest in selectedJob.interests"
                                :key="interest.id"
                                variant="tonal"
                                size="small"
                                class="mr-1 mb-1"
                                label
                              >
                                {{ interest.name }}
                              </v-chip>

                              <span
                                class="text-caption"
                                v-if="
                                  selectedJob.interests?.length === 0 ||
                                  !selectedJob.interests
                                "
                                >Not specified</span
                              >
                            </div>

                            <div class="mb-6">
                              <h3 class="text-title font-weight-bold mb-2">
                                Language
                              </h3>
                              <v-chip
                                v-for="language in selectedJob.languages"
                                :key="language.id"
                                variant="tonal"
                                size="small"
                                class="mr-1 mb-1"
                                label
                              >
                                {{ language.name }}
                              </v-chip>

                              <span
                                class="text-caption"
                                v-if="
                                  selectedJob.languages?.length === 0 ||
                                  !selectedJob.languages
                                "
                                >Not specified</span
                              >
                            </div>
                          </div>
                        </v-card-text>
                      </template>
                    </v-card>
                  </div>
                </v-window-item>
                <v-window-item value="2">
                  <div>
                    <div class="d-flex justify-end">
                      <v-btn
                        v-if="selectedJob.status == 'DRAFT'"
                        color="primary"
                        variant="text"
                        class="mb-2 px-0"
                        @click="handleEdit(2)"
                      >
                        Edit
                      </v-btn>
                    </div>

                    <v-card
                      elevation="0"
                      rounded="lg"
                      style="border: 1px solid #e0e0e0"
                      class="mb-4"
                      v-if="
                        selectedJob.status == 'DRAFT' ||
                        stagesAll.find((i) => i.type == 'SYS_SHORTLIST')
                      "
                    >
                      <v-row align="center" class="pa-3">
                        <v-col>
                          <div class="text-caption text-grey-darken-1">
                            {{ "Auto created by system" }}
                          </div>
                          <div class="font-weight-bold">Shortlisted</div>
                        </v-col>
                      </v-row>
                    </v-card>
                    <v-skeleton-loader
                      v-if="stageLoading"
                      type="list-item-avatar-two-line"
                      class="mb-4"
                    />
                    <template v-else>
                      <v-card
                        v-for="(element, index) in stages"
                        :key="element.id"
                        elevation="0"
                        rounded="lg"
                        style="border: 1px solid #e0e0e0"
                        class="mb-4"
                      >
                        <v-row align="center" class="pa-3">
                          <v-col>
                            <div class="text-caption text-grey-darken-1">
                              {{
                                stageOptions.find(
                                  (i) => i.type === element.type
                                )?.name || "Auto created by system"
                              }}
                            </div>
                            <div class="font-weight-bold">
                              {{ element.step_name }}
                            </div>
                          </v-col>
                          <v-col cols="auto" class="d-flex align-center">
                            <v-btn icon @click="viewStage(index)" variant="text"
                              ><v-icon>mdi-eye</v-icon></v-btn
                            >
                          </v-col>
                        </v-row>
                      </v-card>
                    </template>
                    <v-card
                      elevation="0"
                      rounded="lg"
                      style="border: 1px solid #e0e0e0"
                      class="mb-4"
                      v-if="
                        selectedJob.status == 'DRAFT' ||
                        stagesAll.find((i) => i.type == 'SYS_HIRED')
                      "
                    >
                      <v-row align="center" class="pa-3">
                        <v-col>
                          <div class="text-caption text-grey-darken-1">
                            {{ "Auto created by system" }}
                          </div>
                          <div class="font-weight-bold">Hired</div>
                        </v-col>
                      </v-row>
                    </v-card>
                  </div>
                </v-window-item>
              </v-window>
            </div>
            <v-dialog v-model="stageDialog" scrollable max-width="600px">
              <v-card
                elevation="0"
                rounded="xl"
                style="border: 1px solid #e0e0e0"
              >
                <v-toolbar density="compact" class="bg-transparent">
                  <v-toolbar-title class="text-title">
                    Preview
                  </v-toolbar-title>
                  <v-spacer></v-spacer>
                  <v-btn icon @click="stageDialog = false" variant="text"
                    ><v-icon>mdi-close</v-icon></v-btn
                  >
                </v-toolbar>
                <v-divider></v-divider>
                <v-card-text>
                  <h3 class="text-title mb-2">{{ newStage.step_name }}</h3>

                  <p
                    v-if="newStage.type === 'DETAIL_FULFILLMENT'"
                    class="text-grey-darken-2 mb-2"
                    style="font-size: 14px"
                  >
                    Thank you for your interest in {{ selectedJob.title }} at
                    {{ selectedJob.company?.brand_name }}. Please provide or
                    update the required information in your profile to proceed
                    to the next stage of recruitment.
                  </p>
                  <p class="text-grey-darken-2 mb-4" style="font-size: 14px">
                    {{ newStage.description }}
                  </p>

                  <div v-if="newStage.type === 'QUESTIONNAIRE'">
                    <v-card
                      v-for="(q, idx) in newStage.questionnaires"
                      :key="idx"
                      elevation="0"
                      rounded="xl"
                      style="border: 1px solid #e0e0e0"
                      class="mb-4"
                    >
                      <v-card-text class="pb-0">
                        <div class="text-grey-darken-1">
                          {{ idx + 1 }}. {{ q.question }}
                          <span class="text-red">{{
                            q.is_required ? "*" : ""
                          }}</span>
                        </div>

                        <!-- Input & Preview Options -->
                        <div class="mt-2">
                          <!-- Preview -->
                          <template v-if="q.type === 'TEXT'">
                            <v-textarea
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              rows="2"
                              placeholder="Enter your answer here..."
                              auto-grow
                              style="
                                white-space: pre-wrap !important;
                                resize: vertical;
                              "
                            />
                          </template>
                          <template v-else-if="q.type === 'CHECKBOX'">
                            <v-checkbox
                              v-for="(opt, idx) in q.options"
                              :key="idx"
                              :label="opt || `Option ${idx + 1}`"
                              density="comfortable"
                              variant="outlined"
                              rounded="lg"
                              hide-details
                            />
                          </template>
                          <template v-else-if="q.type === 'RADIO-BUTTON'">
                            <v-radio-group>
                              <v-radio
                                v-for="(opt, idx) in q.options"
                                :key="idx"
                                :label="opt || `Option ${idx + 1}`"
                                :value="opt"
                                density="comfortable"
                                variant="outlined"
                                rounded="lg"
                                hide-details
                              />
                            </v-radio-group>
                          </template>
                          <template v-else-if="q.type === 'DROP-DOWN'">
                            <v-select
                              :items="
                                q.options.length
                                  ? q.options
                                  : ['Option 1', 'Option 2']
                              "
                              label="Select"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                            />
                          </template>
                          <template v-else-if="q.type === 'DATE'">
                            <v-text-field
                              label="Click to show calendar"
                              prepend-inner-icon="mdi-calendar"
                              density="comfortable"
                              variant="outlined"
                              rounded="lg"
                              disabled
                            />
                          </template>
                          <template v-else-if="q.type === 'TIME'">
                            <v-text-field
                              label="Click to show time"
                              prepend-inner-icon="mdi-clock"
                              density="comfortable"
                              variant="outlined"
                              rounded="lg"
                              disabled
                            />
                          </template>
                          <template v-else-if="q.type === 'DATE-TIME'">
                            <v-text-field
                              label="Click to show date time"
                              prepend-inner-icon="mdi-clock"
                              density="comfortable"
                              variant="outlined"
                              rounded="lg"
                              type="datetime-local"
                            />
                          </template>
                          <template v-else-if="q.type === 'ATTACHMENT'">
                            <v-file-input
                              label="Upload file (Max size 5mb)"
                              density="comfortable"
                              variant="outlined"
                              rounded="lg"
                              disabled
                            />
                          </template>
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>
                  <div
                    v-else-if="newStage.type === 'DETAIL_FULFILLMENT'"
                    class="mt-4"
                  >
                    <div
                      v-for="(item, idx) in newStage.attributes.filter(
                        (i) => i.state == 1
                      )"
                      :key="item.name"
                      class="mb-3"
                    >
                      <div class="d-flex align-center">
                        <div>
                          <h4 style="font-size: 14px">{{ item.label }}</h4>
                          <div class="text-caption text-grey">
                            {{ item.notes }}
                          </div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-btn
                          color="primary"
                          variant="outlined"
                          size="small"
                          disabled
                        >
                          UPDATE
                        </v-btn>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="newStage.type === 'TEST_PSYCHO'">
                    <!-- Test Cards -->
                    <div class="space-y-4">
                      <v-card
                        v-for="(test, idx) in newStage.attributes"
                        :key="idx"
                        elevation="0"
                        rounded="xl"
                        style="border: 1px solid #e0e0e0"
                        class="mb-4"
                      >
                        <v-card-text class="pa-6">
                          <!-- Test Header -->
                          <div class="mb-4">
                            <h4
                              class="font-weight-bold mb-2"
                              style="color: #424242"
                            >
                              {{ test.test_name }}
                            </h4>
                            <div class="mb-4">
                              <p class="text-grey-darken-2 mb-3">
                                {{ test.test_description }}
                              </p>
                            </div>
                          </div>

                          <!-- File Type Test -->
                          <template v-if="test.test_type === 'FILE'">
                            <!-- Instructions -->

                            <!-- Download Section -->
                            <div class="mb-4">
                              <p
                                class="mb-1 text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Test Document
                              </p>
                              <div
                                v-if="test.test_file_employer"
                                class="d-flex align-center pa-1 px-2 rounded-lg"
                                style="border: 1px solid #e0e0e0"
                              >
                                <div class="flex-grow-1">
                                  <a
                                    :href="
                                      test.test_file_employer.includes('http')
                                        ? test.test_file_employer
                                        : BASE_URL + test.test_file_employer
                                    "
                                    target="_blank"
                                  >
                                    {{ test.test_file_employer }}
                                  </a>
                                </div>
                                <v-btn
                                  variant="text"
                                  icon
                                  size="small"
                                  @click="downloadTestTemplate(test)"
                                  :loading="downloadingTemplate"
                                >
                                  <v-icon>mdi-download</v-icon>
                                </v-btn>
                              </div>
                            </div>

                            <!-- Upload Section -->
                            <div>
                              <p
                                class="mb-1 text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Filled Test Document
                              </p>
                              <v-file-upload
                                v-model="test.test_file_candidate"
                                placeholder="Upload file (max size 5mb)"
                                rounded="lg"
                                :disabled="true"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                              />
                            </div>
                          </template>

                          <!-- Link Type Test -->
                          <template v-else-if="test.test_type === 'LINK'">
                            <!-- Test Link Section -->
                            <div class="mb-4">
                              <p
                                class="mb-1 text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Test Link
                              </p>
                              <div
                                v-if="test.test_url"
                                class="d-flex align-center pa-3 px-2 rounded-lg"
                                style="border: 1px solid #e0e0e0"
                              >
                                <a
                                  :href="test.test_url"
                                  target="_blank"
                                  class="text-primary text-decoration-underline"
                                  style="font-size: 14px"
                                >
                                  {{ test.test_url }}
                                </a>
                              </div>
                            </div>

                            <!-- Confirmation Section -->
                            <div class="mb-4">
                              <p
                                class="mb-2 text-grey-darken-1"
                                style="font-size: 13px"
                              >
                                Please confirm if you have filled the test
                                document and fill out the name you put in the
                                submission.
                              </p>

                              <div class="d-flex align-center mb-3">
                                <v-checkbox
                                  :model-value="false"
                                  density="compact"
                                  class="mr-2"
                                  style="flex: none"
                                  hide-details
                                  readonly
                                ></v-checkbox>
                                <span class="text-grey-darken-2"
                                  >Yes, the test document has been
                                  submitted.</span
                                >
                              </div>

                              <div>
                                <p
                                  class="mb-1 text-grey-darken-1"
                                  style="font-size: 12px"
                                >
                                  Submission Name
                                </p>
                                <v-text-field
                                  variant="outlined"
                                  density="comfortable"
                                  rounded="lg"
                                  hide-details
                                  readonly
                                ></v-text-field>
                              </div>
                            </div>
                          </template>
                        </v-card-text>
                      </v-card>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-card-text>
          <v-card-text>
            <v-row class="pa-2">
              <v-col
                v-if="!route.query.c"
                cols="12"
                md="2"
                lg="2"
                class="px-1 py-2"
                :order="isMobile ? 4 : 1"
              >
                <v-btn
                  v-if="selectedJob.status == 'DRAFT'"
                  color="error"
                  variant="outlined"
                  @click="handleDeletePost"
                  block
                  height="42"
                  rounded="lg"
                >
                  Delete Post
                </v-btn>
                <v-btn
                  v-else-if="selectedJob.status == 'PUBLISH'"
                  color="error"
                  variant="outlined"
                  @click="handleCloseJob"
                  block
                  height="42"
                  rounded="lg"
                >
                  Close Post
                </v-btn>
                <v-btn
                  v-else-if="selectedJob.status == 'CLOSE'"
                  color="primary"
                  variant="outlined"
                  @click="handleReopenJob"
                  block
                  height="42"
                  size="small"
                  rounded="lg"
                >
                  Re-Open Post
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                md="2"
                lg="2"
                class="px-1 py-2"
                :order="isMobile || isTablet ? 3 : 2"
              >
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="handleCancel"
                  rounded="lg"
                  height="42"
                  block
                >
                  Cancel
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                :lg="route.query.c ? 6 : selectedJob.status == 'DRAFT' ? 4 : 6"
                :md="route.query.c ? 6 : selectedJob.status == 'DRAFT' ? 4 : 6"
                class="pa-1 py-2"
                v-if="isDesktop || isTablet"
                order="3"
              >
              </v-col>

              <v-col
                cols="6"
                md="2"
                lg="2"
                class="px-1 py-2"
                variant="outlined"
                :order="isMobile ? 1 : 4"
                ><v-btn
                  color="primary"
                  variant="outlined"
                  @click="handleBack"
                  block
                  rounded="lg"
                  height="42"
                >
                  Back
                </v-btn></v-col
              >
              <v-col
                v-if="selectedJob.status == 'DRAFT'"
                cols="6"
                md="2"
                lg="2"
                class="px-1 py-2"
                :order="isMobile ? 2 : 5"
              >
                <v-btn
                  color="primary"
                  variant="elevated"
                  @click="handlePublish"
                  :loading="loadingPublish"
                  block
                  rounded="lg"
                  height="42"
                >
                  Publish
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "wizard-job",
  middleware: ["auth", "employer-jobs"],
});
const route = useRoute();
const router = useRouter();

import { ref } from "vue";
const { isMobile, isDesktop, isTablet } = useScreenSize();
const { $apiFetch } = useApi();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const activeTab = ref("0");
const tabTitles = ref(["Job Post", "Recruitment Stages"]);
const nextTab = () => {
  if (activeTab.value < tabTitles.value.length - 1) {
    activeTab.value++;
  }
};
const prevTab = () => {
  if (activeTab.value > 0) {
    activeTab.value--;
  }
};

const jobLoading = ref(false);
const selectedJob = useState("selectedJob", () => ({}));
const fetchJob = async () => {
  jobLoading.value = true;
  const response = await $apiFetch("/jobs/search", {
    params: {
      filters: {
        id: route.params.id,
      },
      limit: 1,
      expands:
        "company, region, salary_country, right_to_work.salary_country, skill, interest, language",
    },
  });
  selectedJob.value = response.items[0];
  jobLoading.value = false;
};
const employmentStatuses = ref([]);
const fetchEmploymentStatuses = async () => {
  const response = await $apiFetch("/configs/key/employment_status");
  employmentStatuses.value = response.value;
};
const domicileStatuses = ref([]);
const fetchDomicileStatuses = async () => {
  const response = await $apiFetch("/configs/key/domicile_status");
  domicileStatuses.value = response.value;
};
const { models, debouncedFetch, fetch } = useDynamicSearch([
  "skill",
  "interest",
]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
};
const rightToWork = ref({
  items: [],
  loading: false,
});
const searchRightToWork = debounce(async (event) => {
  rightToWork.value.loading = true;
  const response = await $apiFetch("/mst-right-to-works/search", {
    params: {
      filters: {
        name: event,
        "salary_country.country_name": event,
        orWhere: ["name", "salary_country.country_name"],
      },
      expands: "salary_country",
    },
  });
  rightToWork.value.items = [
    ...rightToWork.value.items,
    ...response.items.map((item) => ({
      id: item.id,
      name: item.name,
      country_name: item.salary_country.country_name,
      text: `${item.salary_country.country_name} - ${item.name}`,
    })),
  ];
  rightToWork.value.items = Array.from(
    new Map(rightToWork.value.items.map((item) => [item.id, item])).values()
  );
  rightToWork.value.loading = false;
}, 500);

const stages = ref([]);
const stagesAll = ref([]);
const stageLoading = ref(false);
const fetchStages = async () => {
  stageLoading.value = true;
  const response = await $apiFetch("/job-steps/search", {
    params: {
      filters: {
        job_id: route.params.id,
      },
      expands: "questionnaires",
      limit: 100,
      sortBy: { step_order: "asc" },
    },
  });
  stages.value = response.items.filter(
    (i) => i.type != "SYS_SHORTLIST" && i.type != "SYS_HIRED"
  );
  stagesAll.value = response.items;
  stageLoading.value = false;
};
const snackbar = useSnackbarStore();

const stageOptions = [
  { type: "DETAIL_FULFILLMENT", name: "Data Fulfillment" },
  { type: "QUESTIONNAIRE", name: "Questionnaire" },
  { type: "INTERVIEW", name: "Interview" },
];

const addStageMenu = ref(false);

const stageDialog = ref(false);
const newStage = ref({
  type: null,
  name: null,
  description: null,
  questionnaires: [],
});
const viewStage = (index) => {
  stageDialog.value = true;
  stages.value[index].questionnaires = stages.value[index].questionnaires.sort(
    (a, b) => a.no - b.no
  );
  newStage.value = stages.value[index];
};

const loadingAsDraft = ref(false);
function saveCurrentStatus() {
  loadingAsDraft.value = true;
  $apiFetch("/jobs/" + route.params.id, {
    method: "PATCH",
    body: {
      status: selectedJob.value.status,
    },
  })
    .then(() => {
      router.replace("/admin/jobs/employer?id=" + route.params.id);
    })
    .finally(() => {
      loadingAsDraft.value = false;
    });
}

const dialog = useDialogStore();
const handleDeletePost = async () => {
  try {
    await dialog.openDialog({
      title: "Delete Post",
      message:
        "Are you sure you want to delete this post?<br/> this action cannot be undone.",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
      autoClose: false,
    });
    dialog.loading = true;
    $apiFetch(`/jobs/${route.params.id}`, {
      method: "DELETE",
    }).then(() => {
      dialog.closeDialog();
      snackbar.showSnackbar({
        message: "Job deleted successfully",
        color: "success",
      });
      router.replace("/admin/jobs/employer");
    });
  } catch {
    console.log("Close cancelled");
  }
};

const handleCloseJob = async () => {
  await dialog.openDialog({
    title: "Close Job",
    message: "Are you sure you want to close this job?",
    confirmButtonText: "Close",
    confirmButtonColor: "error",
    autoClose: false,
  });
  dialog.loading = true;
  await handleSubmit("CLOSE");
  dialog.closeDialog();
};

const handleReopenJob = async () => {
  await dialog.openDialog({
    title: "Re-open Job",
    message: "Are you sure you want to re-open this job?",
    confirmButtonText: "Re-open",
    confirmButtonColor: "success",
    autoClose: false,
  });
  dialog.loading = true;
  await handleSubmit("PUBLISH");
  dialog.closeDialog();
};

const handleCancel = async () => {
  await dialog.openDialog({
    title: "Cancel",
    message: "Are you sure you want to cancel from this job post?",
    confirmButtonText: "Yes, Confirm",
    confirmButtonColor: "primary",
    autoClose: false,
  });
  dialog.loading = true;
  router.replace("/admin/jobs/employer?id=" + route.params.id);
  dialog.closeDialog();
};

const handleSubmit = async (status) => {
  try {
    const response = await $apiFetch(`/jobs/${route.params.id}`, {
      method: "PATCH",
      body: {
        status: status,
      },
    });
    snackbar.showSnackbar({
      message: "Job updated successfully",
      color: "success",
    });
    router.replace(`/admin/jobs/employer?id=${response.id}`);
  } catch (error) {
    console.error("Error submitting job:", error);
    snackbar.showSnackbar({
      message: "Failed to update job: " + error?.message,
      color: "error",
    });
  }
};

const handleBack = () => {
  router.replace({
    path: "/admin/jobs/employer/form/" + route.params.id + "/2",
    query: route.query,
  });
};

const loadingPublish = ref(false);
const handlePublish = async () => {
  if (selectedJob.value.status == "DRAFT") {
    await dialog.openDialog({
      title: "Publish",
      message: "Are you sure you want to publish this job post?",
      confirmButtonText: "Publish",
      confirmButtonColor: "primary",
      autoClose: false,
    });
    dialog.loading = true;
  }
  loadingPublish.value = true;
  $apiFetch("/jobs/" + route.params.id, {
    method: "PATCH",
    body: {
      status: "PUBLISH",
    },
  })
    .then(() => {
      router.replace("/admin/jobs/employer");
    })
    .finally(() => {
      dialog.loading = false;
      loadingPublish.value = false;
      dialog.closeDialog();
    });
};

const selectStage = (option) => {
  stages.value.push({
    id: Date.now(),
    type: option.type,
    name: option.name,
  });
  addStageMenu.value = false;
};

const handleEdit = (tab) => {
  router.replace("/admin/jobs/employer/form/" + route.params.id + "/" + tab);
};

const downloadingTemplate = ref(false);

const downloadTestTemplate = async (test) => {
  if (!test.test_file_employer) {
    snackbar.showSnackbar({
      message: "Template file not available",
      color: "error",
    });
    return;
  }

  downloadingTemplate.value = true;

  try {
    // Create download link for the template file
    const fileUrl = BASE_URL + test.test_file_employer;
    const fileName =
      test.test_name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_template";

    // Create a temporary link element
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    snackbar.showSnackbar({
      message: "Template downloaded successfully",
      color: "success",
    });
  } catch (error) {
    console.error("Error downloading template:", error);
    snackbar.showSnackbar({
      message: "Failed to download template",
      color: "error",
    });
  } finally {
    downloadingTemplate.value = false;
  }
};

onMounted(async () => {
  fetchEmploymentStatuses();
  fetchDomicileStatuses();
  fetchJob();
  await fetchStages();
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
