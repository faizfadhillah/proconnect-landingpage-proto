<template>
  <v-container fluid>
    <v-card flat rounded="xl" style="border: 1px solid #e0e0e0">
      <v-card-text class="pb-0 pt-2">
        <!-- Search and Filter Section -->
        <v-row>
          <v-col
            cols="12"
            md="5"
            class="pt-6"
            style="border-right: 1px solid #e0e0e0"
          >
            <h2 class="mb-2">Find Jobs</h2>
            <div class="d-flex align-center justify-space-between my-1">
              <v-text-field
                v-model="searchInput"
                placeholder="Search jobs or companies here"
                append-inner-icon="mdi-magnify"
                clearable
                hide-details
                class="mr-2"
                variant="outlined"
                density="comfortable"
                rounded="lg"
              ></v-text-field>

              <v-btn icon @click="filterDialog = true" elevation="0">
                <v-badge
                  v-if="activeFilterCount > 0"
                  color="error"
                  size="small"
                  :content="activeFilterCount"
                >
                  <v-icon color="primary" size="32" icon="mdi-tune"></v-icon>
                </v-badge>
                <v-icon
                  v-else
                  color="primary"
                  size="32"
                  icon="mdi-tune"
                ></v-icon>
              </v-btn>
            </div>

            <v-row class="mt-0">
              <!-- Job Listings -->
              <v-col
                cols="12"
                class="px-0"
                style="overflow-y: auto; height: calc(100vh - 175px)"
              >
                <v-list>
                  <template v-for="(job, index) in jobs" :key="job.id">
                    <v-list-item
                      @click="selectJob(job)"
                      class="pb-2 pt-1"
                      :class="{ 'selected-job': selectedJob?.id === job.id }"
                    >
                      <template v-slot:append>
                        <v-list-item-action>
                          <v-avatar
                            size="60"
                            rounded="lg"
                            class="ml-4 bg-grey-lighten-2"
                          >
                            <v-img
                              v-if="job.company?.logo_url"
                              :src="BASE_URL + job.company?.logo_url"
                              cover
                            ></v-img>
                            <v-icon size="40" color="grey" v-else>
                              mdi-briefcase-outline
                            </v-icon>
                          </v-avatar>
                        </v-list-item-action>
                      </template>
                      <v-list-item-title
                        class="font-weight-bold"
                        style="font-size: 14px"
                        >{{ job.title }}</v-list-item-title
                      >
                      <div>
                        <div>
                          <span class="text-caption text-primary">
                            {{ job.company?.brand_name }}
                            <template v-if="job.company?.branch">
                              ({{ job.company?.branch }})
                            </template>
                          </span>
                          <template
                            v-if="
                              (!job.is_outside_indo && job.region?.name) ||
                              (!job.is_outside_indo && job.other_region)
                            "
                          >
                            <span class="text-grey-darken-2 mx-1">•</span>
                            <span class="text-caption text-grey-darken-2">
                              {{
                                job.is_outside_indo
                                  ? job.other_region
                                  : job.region?.name
                              }}
                            </span>
                          </template>
                        </div>
                        <div
                          style="font-size: 12px"
                          v-if="job.min_salary || job.max_salary"
                        >
                          {{ job.salary_country?.currency_code || "IDR" }}
                          {{ formatNumber(job.min_salary) }} -
                          {{ job.salary_country?.currency_code || "IDR" }}
                          {{ formatNumber(job.max_salary) }} per month
                        </div>
                        <div>
                          <span class="text-caption text-grey-darken-2">{{
                            formatTimeAgo(job.updated_at)
                          }}</span>
                          <span
                            class="text-caption text-red-darken-2"
                            v-if="job.status == 'CLOSED'"
                          >
                            - Closed
                          </span>
                        </div>
                      </div>
                    </v-list-item>
                    <v-divider
                      class="mt-0"
                      v-if="index < jobs.length - 1"
                    ></v-divider>
                  </template>
                  <template v-if="isLoading">
                    <v-skeleton-loader
                      type="list-item-two-line"
                      height="100"
                    ></v-skeleton-loader>
                  </template>
                  <div
                    v-if="!isLoading && jobs.length === 0"
                    class="text-center my-8"
                  >
                    <v-icon size="48" color="grey-lighten-1"
                      >mdi-briefcase-off-outline</v-icon
                    >
                    <div class="mt-2 text-grey-darken-1">No jobs found</div>
                  </div>
                </v-list>
                <v-card-text>
                  <v-btn
                    v-if="params.page < totalPages"
                    color="primary"
                    block
                    variant="outlined"
                    rounded
                    :loading="isLoading"
                    @click="fetchJobs(params.page + 1)"
                  >
                    Load More
                  </v-btn>
                </v-card-text>
              </v-col>
            </v-row>
          </v-col>
          <v-col
            v-if="!isMobile"
            cols="12"
            md="7"
            style="overflow-y: auto; height: calc(100vh - 85px)"
          >
            <v-card flat v-if="selectedJob">
              <v-list>
                <v-list-item class="pb-2">
                  <template v-slot:append>
                    <v-list-item-action>
                      <div class="d-flex flex-column align-center">
                        <v-avatar
                          size="60"
                          rounded="lg"
                          class="ml-4 bg-grey-lighten-2 mb-2"
                        >
                          <v-img
                            v-if="selectedJob.company?.logo_url"
                            :src="BASE_URL + selectedJob.company?.logo_url"
                            cover
                          ></v-img>
                          <v-icon size="40" color="grey" v-else>
                            mdi-briefcase-outline
                          </v-icon>
                        </v-avatar>
                        <v-btn
                          v-if="selectedJob.status === 'PUBLISH'"
                          variant="text"
                          size="small"
                          @click="shareDialog = true"
                          class="text-caption"
                          style="min-width: auto"
                        >
                          <v-icon size="18" class="mr-1">mdi-share-variant</v-icon>
                          Share
                        </v-btn>
                      </div>
                    </v-list-item-action>
                  </template>
                  <SkillMatchBadge
                    :skill-match="selectedJob.skill_match"
                    :is-internal="selectedJob.is_internal"
                    :clickable="true"
                    :job-id="selectedJob.id"
                    :user-id="me?.id"
                    @click="openSkillMatchDialog"
                  />
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
                      v-if="selectedJob.min_salary || selectedJob.max_salary"
                    >
                      {{ selectedJob.salary_country?.currency_code || "IDR" }}
                      {{ formatNumber(selectedJob.min_salary) }} -
                      {{ selectedJob.salary_country?.currency_code || "IDR" }}
                      {{ formatNumber(selectedJob.max_salary) }} per month
                    </div>
                    <div>
                      <span class="text-caption text-grey-darken-2">{{
                        formatTimeAgo(selectedJob.updated_at)
                      }}</span>
                    </div>
                  </div>
                </v-list-item>
              </v-list>
              <v-card-text class="pt-0">
                <div class="mb-5">
                  <v-chip
                    class="mr-2"
                    label
                    v-for="s in selectedJob.domicile_status?.filter(
                      (s) => s !== null
                    )"
                    :key="s"
                  >
                    {{ domicileStatuses.find((e) => e.name === s)?.label || s }}
                  </v-chip>
                  <v-chip
                    class="mr-2"
                    label
                    v-for="s in selectedJob.employment_status?.filter(
                      (s) => s !== null
                    )"
                    :key="s"
                  >
                    {{
                      employmentStatuses.find((e) => e.name === s)?.label || s
                    }}
                  </v-chip>
                </div>
                <v-row v-if="!jobAppliedLoading">
                  <v-col cols="6">
                    <v-btn
                      v-if="checkJobSaved(selectedJob.id)"
                      block
                      color="primary"
                      rounded="lg"
                      variant="outlined"
                      @click="handleUnsave"
                      :disabled="checkJobApplied(selectedJob.id)"
                      :loading="loadingUnsaving"
                    >
                      Un-Save
                    </v-btn>
                    <v-btn
                      v-else
                      block
                      color="primary"
                      rounded="lg"
                      variant="outlined"
                      @click="handleSave"
                      :disabled="checkJobApplied(selectedJob.id)"
                      :loading="loadingSaving"
                    >
                      Save
                    </v-btn>
                  </v-col>
                  <v-col cols="6">
                    <v-btn
                      v-if="checkJobApplied(selectedJob.id)"
                      block
                      color="primary"
                      rounded="lg"
                      :to="`/admin/jobs/applied/${selectedJob.id}`"
                    >
                      View Application
                    </v-btn>
                    <v-btn
                      v-else
                      block
                      :color="
                        checkJobApplied(selectedJob.id) ? 'grey' : 'primary'
                      "
                      rounded="lg"
                      @click="handleApply"
                      :loading="loadingApplying"
                      :disabled="checkJobApplied(selectedJob.id)"
                    >
                      {{
                        checkJobApplied(selectedJob.id) ? "Applied" : "Apply"
                      }}
                    </v-btn>
                  </v-col>
                </v-row>
                <div class="d-flex align-center mb-6"></div>

                <!-- Job Details -->
                <div class="job-details">
                  <h3 class="text-title mb-3">Job Description</h3>

                  <rich-text-view v-model="selectedJob.description" />

                  <h3 class="text-title mb-2">Right To Work</h3>
                  <div class="mb-6">
                    <ul class="ml-4">
                      <li
                        v-for="rtw in selectedJob.right_to_works"
                        :key="rtw.id"
                      >
                        {{ rtw.salary_country?.country_name }} - {{ rtw.name }}
                      </li>
                    </ul>
                    <span v-if="selectedJob.right_to_works.length === 0"
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

                  <div class="mb-6" v-if="selectedJob.skills">
                    <h3 class="text-title font-weight-bold mb-2">Job Skills</h3>
                    <v-chip
                      v-for="skill in selectedJob.skills"
                      :key="skill.id"
                      variant="tonal"
                      label
                      class="mr-1 mb-1"
                    >
                      {{ skill.name }}
                    </v-chip>

                    <span
                      v-if="
                        selectedJob.skills?.length === 0 || !selectedJob.skills
                      "
                      >Not specified</span
                    >
                  </div>

                  <div class="mb-6" v-if="selectedJob.interests">
                    <h3 class="text-title font-weight-bold mb-2">Interest</h3>
                    <v-chip
                      v-for="interest in selectedJob.interests"
                      :key="interest.id"
                      variant="tonal"
                      class="mr-1 mb-1"
                      label
                    >
                      {{ interest.name }}
                    </v-chip>

                    <span
                      v-if="
                        selectedJob.interests.length === 0 ||
                        !selectedJob.interests
                      "
                      >Not specified</span
                    >
                  </div>

                  <div class="mb-6" v-if="selectedJob.languages">
                    <h3 class="text-title font-weight-bold mb-2">Language</h3>
                    <v-chip
                      v-for="language in selectedJob.languages"
                      :key="language.id"
                      variant="tonal"
                      class="mr-1 mb-1"
                      label
                    >
                      {{ language.name }}
                    </v-chip>

                    <span
                      v-if="
                        selectedJob.languages.length === 0 ||
                        !selectedJob.languages
                      "
                      >Not specified</span
                    >
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-overlay
            :model-value="loadingJobDetail"
            contained
            class="align-center justify-center"
            style="z-index: 1"
            persistent
          >
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
          </v-overlay>
          <v-dialog
            v-if="isMobile"
            v-model="detailDialog"
            persistent
            fullscreen
            style="z-index: 1900"
          >
            <v-card flat>
              <v-toolbar density="comfortable" class="bg-transparent px-2" flat>
                <v-row class="align-center px-3" style="min-width: 220px">
                  <v-btn
                    icon
                    size="small"
                    @click="router.replace('/admin/jobs/all')"
                    elevation="0"
                    color="primary"
                    class="mr-2"
                    style="background: rgba(255, 255, 255, 0.1)"
                  >
                    <v-icon size="20">mdi-arrow-left</v-icon>
                  </v-btn>
                </v-row>
                <v-spacer style="width: 90%"></v-spacer>
                <Notification></Notification>
              </v-toolbar>
              <v-divider />
              <v-overlay
                :model-value="loadingJobDetail"
                contained
                class="align-center justify-center"
                style="z-index: 1"
              >
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
              </v-overlay>
              <template v-if="selectedJob">
                <v-list style="min-height: 140px">
                  <v-list-item class="pb-2">
                    <template v-slot:append>
                      <v-list-item-action>
                        <div class="d-flex flex-column align-center">
                          <v-avatar
                            size="60"
                            rounded="lg"
                            class="ml-4 bg-grey-lighten-2 mb-2"
                          >
                            <v-img
                              v-if="selectedJob.company?.logo_url"
                              :src="BASE_URL + selectedJob.company?.logo_url"
                              cover
                            ></v-img>
                            <v-icon size="40" color="grey" v-else>
                              mdi-briefcase-outline
                            </v-icon>
                          </v-avatar>
                          <v-btn
                            v-if="selectedJob.status === 'PUBLISH'"
                            variant="text"
                            size="small"
                            @click="shareDialog = true"
                            class="text-caption"
                            style="min-width: auto"
                          >
                            <v-icon size="18" class="mr-1">mdi-share-variant</v-icon>
                            Share
                          </v-btn>
                        </div>
                      </v-list-item-action>
                    </template>
                    <SkillMatchBadge
                      :skill-match="selectedJob.skill_match"
                      :is-internal="selectedJob.is_internal"
                      :clickable="true"
                      :job-id="selectedJob.id"
                      :user-id="me?.id"
                      @click="openSkillMatchDialog"
                    />
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
                        v-if="selectedJob.min_salary || selectedJob.max_salary"
                      >
                        {{ selectedJob.salary_country?.currency_code || "IDR" }}
                        {{ formatNumber(selectedJob.min_salary) }} -
                        {{ selectedJob.salary_country?.currency_code || "IDR" }}
                        {{ formatNumber(selectedJob.max_salary) }} per month
                      </div>
                      <div>
                        <span class="text-caption text-grey-darken-2">{{
                          formatTimeAgo(selectedJob.updated_at)
                        }}</span>
                      </div>
                    </div>
                  </v-list-item>
                </v-list>
                <v-card-text class="pt-0 px-4">
                  <div class="mb-5">
                    <v-chip
                      class="mr-2"
                      label
                      v-for="s in selectedJob.domicile_status?.filter(
                        (s) => s !== null
                      )"
                      :key="s"
                    >
                      {{
                        domicileStatuses.find((e) => e.name === s)?.label || s
                      }}
                    </v-chip>
                    <v-chip
                      class="mr-2"
                      label
                      v-for="s in selectedJob.employment_status?.filter(
                        (s) => s !== null
                      )"
                      :key="s"
                    >
                      {{
                        employmentStatuses.find((e) => e.name === s)?.label || s
                      }}
                    </v-chip>
                  </div>
                  <v-row v-if="!jobAppliedLoading">
                    <v-col cols="6">
                      <v-btn
                        v-if="checkJobSaved(selectedJob.id)"
                        block
                        color="primary"
                        rounded="lg"
                        variant="outlined"
                        @click="handleUnsave"
                        :disabled="checkJobApplied(selectedJob.id)"
                        :loading="loadingUnsaving"
                      >
                        Un-Save
                      </v-btn>
                      <v-btn
                        v-else
                        block
                        color="primary"
                        rounded="lg"
                        variant="outlined"
                        @click="handleSave"
                        :disabled="checkJobApplied(selectedJob.id)"
                        :loading="loadingSaving"
                      >
                        Save
                      </v-btn>
                    </v-col>
                    <v-col cols="6">
                      <v-btn
                        v-if="checkJobApplied(selectedJob.id)"
                        block
                        color="primary"
                        rounded="lg"
                        :to="`/admin/jobs/applied/${selectedJob.id}`"
                      >
                        View Application
                      </v-btn>
                      <v-btn
                        v-else
                        block
                        :color="
                          checkJobApplied(selectedJob.id) ? 'grey' : 'primary'
                        "
                        rounded="lg"
                        @click="handleApply"
                        :loading="loadingApplying"
                        :disabled="checkJobApplied(selectedJob.id)"
                      >
                        {{
                          checkJobApplied(selectedJob.id) ? "Applied" : "Apply"
                        }}
                      </v-btn>
                    </v-col>
                  </v-row>
                  <div class="d-flex align-center mb-6"></div>

                  <!-- Job Details -->
                  <div class="job-details">
                    <h3 class="text-title mb-3">Job Description</h3>

                    <rich-text-view v-model="selectedJob.description" />

                    <h3 class="text-title mb-2">Right To Work</h3>
                    <div class="mb-6">
                      <ul class="ml-4">
                        <li
                          v-for="rtw in selectedJob.right_to_works"
                          :key="rtw.id"
                        >
                          {{ rtw.salary_country?.country_name }} -
                          {{ rtw.name }}
                        </li>
                      </ul>
                      <span v-if="selectedJob.right_to_works.length === 0"
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

                    <div class="mb-6" v-if="selectedJob.skills">
                      <h3 class="text-title font-weight-bold mb-2">
                        Job Skills
                      </h3>
                      <v-chip
                        v-for="skill in selectedJob.skills"
                        :key="skill.id"
                        variant="tonal"
                        label
                        class="mr-1 mb-1"
                      >
                        {{ skill.name }}
                      </v-chip>

                      <span
                        v-if="
                          selectedJob.skills?.length === 0 ||
                          !selectedJob.skills
                        "
                        >Not specified</span
                      >
                    </div>

                    <div class="mb-6" v-if="selectedJob.interests">
                      <h3 class="text-title font-weight-bold mb-2">Interest</h3>
                      <v-chip
                        v-for="interest in selectedJob.interests"
                        :key="interest.id"
                        variant="tonal"
                        class="mr-1 mb-1"
                        label
                      >
                        {{ interest.name }}
                      </v-chip>

                      <span
                        v-if="
                          selectedJob.interests.length === 0 ||
                          !selectedJob.interests
                        "
                        >Not specified</span
                      >
                    </div>

                    <div class="mb-6" v-if="selectedJob.languages">
                      <h3 class="text-title font-weight-bold mb-2">Language</h3>
                      <v-chip
                        v-for="language in selectedJob.languages"
                        :key="language.id"
                        variant="tonal"
                        class="mr-1 mb-1"
                        label
                      >
                        {{ language.name }}
                      </v-chip>

                      <span
                        v-if="
                          selectedJob.languages.length === 0 ||
                          !selectedJob.languages
                        "
                        >Not specified</span
                      >
                    </div>
                  </div>
                </v-card-text>
              </template>
            </v-card>
          </v-dialog>
        </v-row>
        <!-- Main Content Area -->
      </v-card-text>
    </v-card>

    <v-dialog v-model="filterDialog" max-width="600" persistent>
      <v-card rounded="xl" elevation="0">
        <v-form @submit.prevent="applyFilter">
          <v-toolbar density="compact" flat class="bg-transparent">
            <v-toolbar-title>Filter Jobs</v-toolbar-title>
            <v-spacer />
            <v-btn icon @click="filterDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-divider />

          <v-card-text style="overflow-y: auto; height: 500px; font-size: 12px">
            <!-- City -->
            <div>
              <div class="mb-1"><b>City</b></div>
              <v-text-field
                placeholder="Search city"
                v-model="filterData.city"
                density="compact"
                variant="outlined"
                rounded="lg"
                clearable
              />
            </div>

            <!-- Employment Status -->
            <div class="mb-4">
              <div class="mb-1"><b>Employment Status</b></div>
              <v-row>
                <v-col cols="4" v-for="e in employmentStatuses" :key="e.name">
                  <v-checkbox
                    hide-details
                    density="compact"
                    class="mr-2"
                    :value="e.name"
                    :label="e.label"
                    v-model="filterData.employmentStatus"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Domicile Status -->
            <div class="mb-4">
              <div class="mb-1"><b>Domicile Status</b></div>
              <v-row>
                <v-col cols="4" v-for="e in domicileStatuses" :key="e.name">
                  <v-checkbox
                    hide-details
                    density="compact"
                    class="mr-2"
                    :value="e.name"
                    :label="e.label"
                    v-model="filterData.domicileStatus"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Interest -->
            <div class="mb-4">
              <div class="mb-1"><b>Interest</b></div>
              <v-autocomplete
                placeholder="Search interest"
                v-model="filterData.interest"
                :items="models.interest.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                v-model:search="searchInterest"
                :loading="models.interest.loading"
                @update:search="
                  handleInput($event, 'interest', ['name'], 'mst-interests')
                "
                rounded="lg"
                multiple
                clearable
                hide-no-data
                hide-details
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip v-bind="props" label color="primary" variant="flat">
                    {{ item.raw.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </div>

            <!-- Skills -->
            <div class="mb-4">
              <div class="mb-1"><b>Skills</b></div>
              <v-autocomplete
                placeholder="You may select more than one skill"
                v-model="filterData.skills"
                :items="models.skill.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                v-model:search="searchSkills"
                :loading="models.skill.loading"
                @update:search="
                  handleInput($event, 'skill', ['name'], 'mst-skills')
                "
                rounded="lg"
                multiple
                clearable
                hide-no-data
                hide-details
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip v-bind="props" label color="primary" variant="flat">
                    {{ item.raw.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </div>

            <!-- Right to Work -->
            <div class="mb-4">
              <div class="mb-1"><b>Right to Work</b></div>
              <v-autocomplete
                placeholder="Search right to work"
                v-model="filterData.rightToWork"
                :items="rightToWork.items"
                item-title="text"
                item-value="id"
                variant="outlined"
                density="compact"
                @update:search="searchRightToWork"
                :loading="rightToWork.loading"
                rounded="lg"
                multiple
                clearable
                hide-no-data
                hide-details
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip v-bind="props" label color="primary" variant="flat">
                    {{ item.raw.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </div>
          </v-card-text>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-btn
                  block
                  variant="elevated"
                  color="grey-lighten-2"
                  rounded="lg"
                  @click="resetFilter"
                  >Reset</v-btn
                >
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  type="submit"
                  variant="elevated"
                  color="primary"
                  rounded="lg"
                  :loading="loadingApplyingFilter"
                  >Save</v-btn
                >
              </v-col>
            </v-row>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Skill Match Dialog -->
    <SkillMatchDialog
      v-model="skillMatchDialog"
      :job-id="selectedSkillMatchJobId"
      :user-id="selectedSkillMatchUserId"
    />

    <!-- Share Job Dialog -->
    <ShareJobDialog
      v-model="shareDialog"
      :job-id="selectedJob?.id"
      :job-title="selectedJob?.title"
      :company-name="selectedJob?.company?.brand_name"
      :location="jobLocation"
    />
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

import { ref, computed } from "vue";

// State
const router = useRouter();
const route = useRoute();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const searchInput = ref(route.query.search || null);
const citySearch = ref("");
const activeFilter = ref("all");
const selectedJob = ref(null);
const { $apiFetch } = useApi();
// Mock data for jobs (replace with actual API data)

const { me, fetchMe } = useUser();

const params = ref({
  page: 1,
  limit: 10,
  expands: "company, region, salary_country",
});
const totalPages = ref(0);
const isLoading = ref(true);
watch(searchInput, () => {
  searchJobs();
});
const jobs = ref([]);
const searchJobs = debounce(async () => {
  await fetchJobs();
}, 500);
const fetchJobs = async (page = 1) => {
  if (page == 1) {
    jobs.value = [];
  }
  isLoading.value = true;
  params.value.page = page;
  params.value.filters = {
    title: searchInput.value,
    description: searchInput.value,
    "company.company_name": searchInput.value,
    "region.full_name": filterData.value.city,
    other_region: filterData.value.city,
    domicile_status: filterData.value.domicileStatus,
    employment_status: filterData.value.employmentStatus,
    orWhere: [
      "title",
      "description",
      "company.company_name",
      "other_region",
      "region.full_name",
    ],
    status: "PUBLISH",
  };
  if (filterData.value.interest.length > 0) {
    params.value.filters["interest.id"] = filterData.value.interest;
  }
  if (filterData.value.skills.length > 0) {
    params.value.filters["skill.id"] = filterData.value.skills;
  }
  if (filterData.value.rightToWork.length > 0) {
    params.value.filters["right_to_work.id"] = filterData.value.rightToWork;
  }
  params.value.sortBy = {
    updated_at: "desc",
  };
  params.value.expands =
    "company, region, salary_country, right_to_work.salary_country";
  const response = await $apiFetch("/jobs/search", { params: params.value });
  if (page == 1) {
    jobs.value = [];
  }
  jobs.value = [...jobs.value, ...response.items];
  totalPages.value = response.meta.totalPages;
  isLoading.value = false;
  if (response.items.length > 0) {
    if (route.query.id) {
      selectedJob.value = jobs.value.find((job) => job.id === route.query.id);
      if (!selectedJob.value) {
        const res = await $apiFetch("/jobs/search", {
          params: {
            id: route.query.id,
            expands:
              "company, region, salary_country, right_to_work.salary_country, skill, interest, language",
            isCalculateSkillMatch: true,
          },
        });
        jobs.value = [...res.items, ...jobs.value];
        selectedJob.value = res.items[0];
      } else {
        // Fetch job detail with skill match calculation
        await fetchJobDetail(route.query.id);
      }
      detailDialog.value = true;
    } else {
      selectedJob.value = response.items[0];
      fetchJobDetail(selectedJob.value.id);
    }
  } else {
    selectedJob.value = null;
  }

  fetchJobSaveds(jobs.value.map((job) => job.id));
  fetchJobApplieds(jobs.value.map((job) => job.id));
};

const jobSavedIds = ref([]);
const fetchJobSaveds = async (job_ids) => {
  const response = await $apiFetch("/applicants/search", {
    params: {
      filters: {
        job_id: job_ids,
        user_id: me.value.id,
        status: "SAVED",
      },
    },
  });
  jobSavedIds.value = response.items.map((job) => job.job_id);
};
const checkJobSaved = (job_id) => {
  return jobSavedIds.value.includes(job_id);
};

const jobAppliedIds = ref([]);
const jobAppliedLoading = ref(false);
const fetchJobApplieds = async (job_ids) => {
  jobAppliedLoading.value = true;
  const response = await $apiFetch("/applicants/search", {
    params: {
      filters: {
        job_id: job_ids,
        user_id: me.value.id,
        status: [
          "APPLIED",
          "CONNECT",
          "NEED_REVIEW",
          "PROCESS",
          "SCHEDULE_INTERVIEW",
          "ACCEPTED",
          "REJECTED",
        ],
      },
    },
  });
  jobAppliedIds.value = response.items.map((job) => job.job_id);
  jobAppliedLoading.value = false;
};
const checkJobApplied = (job_id) => {
  return jobAppliedIds.value.includes(job_id);
};

const loadingSaving = ref(false);
const snackbar = useSnackbarStore();
const handleSave = async () => {
  loadingSaving.value = true;
  try {
    await $apiFetch(`/applicants`, {
      method: "POST",
      body: {
        job_id: selectedJob.value.id,
        user_id: me.value.id,
        status: "SAVED",
      },
    });
    jobSavedIds.value = [...jobSavedIds.value, selectedJob.value.id];
    snackbar.showSnackbar({
      message: "Job saved successfully",
      color: "success",
    });
  } catch (error) {
    console.error("Error saving job:", error);
    // Show error message
  } finally {
    loadingSaving.value = false;
  }
};

const loadingUnsaving = ref(false);
const handleUnsave = async () => {
  loadingUnsaving.value = true;
  try {
    await $apiFetch(`/applicants/${selectedJob.value.id}/${me.value.id}`, {
      method: "DELETE",
    });
    jobSavedIds.value = jobSavedIds.value.filter(
      (id) => id !== selectedJob.value.id
    );
    snackbar.showSnackbar({
      message: "Job unsaved successfully",
      color: "success",
    });
    // Show success message
  } catch (error) {
    console.error("Error saving job:", error);
    // Show error message
  } finally {
    loadingUnsaving.value = false;
  }
};

const loadingApplying = ref(false);
const handleApply = async () => {
  loadingApplying.value = true;
  try {
    await $apiFetch(`/applicants`, {
      method: "POST",
      body: {
        job_id: selectedJob.value.id,
        user_id: me.value.id,
        status: "CONNECT",
      },
    });
    snackbar.showSnackbar({
      message: "Applied to job successfully",
      color: "success",
    });
    jobAppliedIds.value = [...jobAppliedIds.value, selectedJob.value.id];
    // Show success message
  } catch (error) {
    console.error("Error applying to job:", error);
    // Show error message
  } finally {
    loadingApplying.value = false;
  }
};

watch(activeFilter, () => {
  fetchJobs(1);
});

const loadingJobDetail = ref(false);
const fetchJobDetail = async (jobId) => {
  loadingJobDetail.value = true;
  try {
    const res = await $apiFetch("/jobs/search", {
      params: {
        id: jobId,
        expands:
          "company, region, salary_country, right_to_work.salary_country, skill, interest, language",
        isCalculateSkillMatch: true,
      },
    });
    if (res.items && res.items.length > 0) {
      const jobDetail = res.items[0];
      // Update job in jobs array if exists
      const jobIndex = jobs.value.findIndex((j) => j.id === jobId);
      if (jobIndex !== -1) {
        jobs.value[jobIndex] = { ...jobs.value[jobIndex], ...jobDetail };
      }
      selectedJob.value = jobDetail;
    }
  } catch (error) {
    console.error("Error fetching job detail:", error);
    // Fallback to existing job data
    selectedJob.value = jobs.value.find((job) => job.id === jobId);
  } finally {
    loadingJobDetail.value = false;
  }
};

const selectJob = async (job) => {
  router.push({ query: { ...route.query, id: job.id } });
  // fetchJobDetail will be called by the watcher when route.query.id changes
};

const { isMobile, isDesktop } = useScreenSize();
const detailDialog = ref(false);
watch(
  () => route.query.id,
  async (newId) => {
    if (newId) {
      // Fetch job detail with skill match calculation
      await fetchJobDetail(newId);
      detailDialog.value = true;
    } else {
      detailDialog.value = false;
    }
  }
);

const filterDialog = ref(false);
const skillMatchDialog = ref(false);
const selectedSkillMatchJobId = ref(null);
const selectedSkillMatchUserId = ref(null);
const shareDialog = ref(false);
const filterData = ref({
  city: null,
  employmentStatus: [],
  domicileStatus: [],
  interest: [],
  skills: [],
  rightToWork: [],
});
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

const resetFilter = () => {
  filterData.value = {
    city: null,
    employmentStatus: [],
    domicileStatus: [],
    interest: [],
    skills: [],
    rightToWork: [],
  };
  searchInput.value = null;
  fetchJobs(1);
};

const loadingApplyingFilter = ref(false);
const applyFilter = () => {
  loadingApplyingFilter.value = true;
  route.query.id = null;
  fetchJobs(1);
  setTimeout(() => {
    filterDialog.value = false;
    loadingApplyingFilter.value = false;
  }, 500);
};

const activeFilterCount = computed(() => {
  return Object.values(filterData.value).filter((value) =>
    Array.isArray(value) ? value.length > 0 : !!value
  ).length;
});

const formatSkillMatch = (skillMatch) => {
  if (skillMatch === -1 || skillMatch === null || skillMatch === undefined) {
    return "- %";
  }
  return `${skillMatch.toFixed(0)}%`;
};

const openSkillMatchDialog = (data) => {
  selectedSkillMatchJobId.value = data.jobId;
  selectedSkillMatchUserId.value = data.userId;
  skillMatchDialog.value = true;
};

const jobLocation = computed(() => {
  if (!selectedJob.value) return "";
  if (selectedJob.value.is_outside_indo) {
    return `${selectedJob.value.other_city || ""} ${selectedJob.value.other_country || ""}`.trim();
  }
  return selectedJob.value.region?.name ? `${selectedJob.value.region.name} INDONESIA` : "";
});

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchEmploymentStatuses();
  fetchDomicileStatuses();
  await fetchJobs();
});
</script>

<style scoped>
.v-btn-group .v-btn {
  text-transform: none;
}

.selected-job {
  background-color: #e4edf8;
}

.job-details ul {
  list-style-type: disc;
  margin-bottom: 1rem;
}

.job-details li {
  margin-bottom: 0.5rem;
}

.sticky-card {
  position: sticky !important;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}
</style>
