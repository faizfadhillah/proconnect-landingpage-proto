<template>
  <v-card
    elevation="0"
    rounded="lg"
    class="mb-4"
    style="border: 1px solid #e0e0e0"
    v-if="
      localAjs?.attributes &&
      ['REVISED', 'RESCHEDULED'].includes(localAjs.status)
    "
  >
    <v-card-text>
      <div class="font-weight-bold" style="font-size: 18px">
        <template v-if="localAjs.status == 'RESCHEDULED'">
          Interview Rescheduled
        </template>
        <template v-else> Interview Reschedule Requested </template>
        <v-chip
          v-if="
            ['REQUESTED', 'PENDING'].includes(
              localAjs.attributes?.reschedule_request
            )
          "
          color="yellow-darken-1"
          variant="flat"
          size="small"
          class="ml-1"
          >Requested</v-chip
        >
        <v-chip
          v-if="localAjs.attributes?.reschedule_request == 'ACCEPTED'"
          color="success"
          variant="flat"
          size="small"
          class="ml-1"
          >Approved</v-chip
        >
        <v-chip
          v-if="localAjs.attributes?.reschedule_request == 'REJECTED'"
          color="error"
          variant="flat"
          size="small"
          class="ml-1"
          >Rejected</v-chip
        >
      </div>
      <div class="mt-2" style="color: #757575">
        <template v-if="localAjs.status == 'RESCHEDULED'">
          The interview has been rescheduled. Please review the updated schedule
          and ensure all participants are notified of the changes. The previous
          schedule has been cancelled and replaced with the new one.
        </template>
        <template v-else>
          The candidate was unable to attend the original interview schedule and
          has requested a reschedule. Please review their request and propose a
          new time that works for both parties. Below is the candidate's reason:
        </template>
      </div>
      <div class="mt-4 text-grey-darken-2 mb-6 font-weight-bold">
        {{ localAjs.attributes?.reschedule_request_notes_from_candidate }}
      </div>
      <div
        v-if="
          ['REQUESTED', 'PENDING'].includes(
            localAjs.attributes?.reschedule_request
          ) || ['REVISED'].includes(localAjs.status)
        "
      >
        <v-row>
          <v-col cols="6">
            <v-btn
              variant="outlined"
              rounded="lg"
              color="error"
              block
              @click="handleRejectReschedule"
              :loading="rejectRescheduleLoading"
            >
              Decline Request
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              variant="outlined"
              rounded="lg"
              color="primary"
              block
              @click="handleAcceptReschedule"
              :loading="acceptRescheduleLoading"
            >
              Approve Request
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
  <v-card
    elevation="0"
    rounded="lg"
    style="border: 1px solid #e0e0e0; margin-bottom: 80px"
    v-if="localAjs?.jobStep"
  >
    <v-card-text class="pa-6">
      <template
        v-if="['CURRENT', 'PENDING', 'SKIPPED'].includes(localAjs.status)"
      >
        <div class="font-weight-bold" style="font-size: 20px">
          {{ localAjs?.jobStep?.step_name }}
          <v-chip
            v-if="localAjs.status === 'SKIPPED'"
            :color="colorAjsStatus(localAjs.status, 'employer', true)"
            variant="flat"
            size="small"
            class="ml-1"
            >{{ labelAjsStatus(localAjs.status, "employer", true) }}</v-chip
          >
        </div>
        <div class="mt-2" style="color: #757575">
          Review the candidate's information below to ensure all details are
          accurate and complete before proceeding.
        </div>
        <div class="mt-2" style="color: #757575">
          {{ localAjs.jobStep.description }}
        </div>

        <div style="margin: 0px -33px 0px -33px; z-index: -1">
          <component
            v-if="FillmentPreview && applicant?.user_id"
            :is="FillmentPreview"
            :isFillment="false"
            :attributes="[
              { id: 1, state: 1 },
              { id: 2, state: 1 },
              { id: 3, state: 1 },
              { id: 4, state: 1 },
              { id: 5, state: 1 },
              { id: 6, state: 1 },
              { id: 7, state: 1 },
              { id: 8, state: 1 },
              { id: 9, state: 1 },
              { id: 10, state: 1 },
            ]"
            :user_id="applicant.user_id"
          />
        </div>
      </template>
      <template v-else-if="['ACCEPTED', 'FAILED'].includes(localAjs.status)">
        <div class="d-flex justify-space-between">
          <div>
            <div class="font-weight-bold" style="font-size: 20px">
              {{ localAjs?.jobStep?.step_name }}
              <v-chip
                :color="localAjs.status === 'ACCEPTED' ? 'success' : 'error'"
                size="small"
                class="ml-2"
                variant="flat"
              >
                {{ localAjs.status === "ACCEPTED" ? "Approved" : "Rejected" }}
              </v-chip>
            </div>
            <div class="mt-2" style="color: #757575">
              {{
                localAjs.status === "ACCEPTED"
                  ? "The interview has been completed successfully. Below are the interview results and any attached documents."
                  : "The interview has been completed but the candidate was not approved. Below are the interview results and any attached documents."
              }}
            </div>
          </div>
        </div>

        <template
          v-if="
            localAjs.attributes?.notes_interview_results ||
            localAjs.attributes?.attachment_interview_results
          "
        >
          <v-divider class="my-4" />

          <div v-if="localAjs.attributes?.notes_interview_results" class="mb-4">
            <div class="font-weight-bold mb-2">Interview Notes</div>
            <div style="white-space: pre-wrap">
              {{ localAjs.attributes.notes_interview_results }}
            </div>
          </div>

          <div v-if="localAjs.attributes?.attachment_interview_results">
            <div class="font-weight-bold mb-2">Interview Result Document</div>
            <v-btn
              variant="outlined"
              color="primary"
              rounded="lg"
              :href="
                BASE_URL + localAjs.attributes.attachment_interview_results
              "
              target="_blank"
            >
              <v-icon class="mr-2">mdi-download</v-icon>
              Download Result
            </v-btn>
          </div>
        </template>
      </template>
      <template v-if="!saveLoading">
        <div
          class="d-flex justify-space-between"
          v-if="
            !['CURRENT', 'PENDING', 'ACCEPTED', 'FAILED'].includes(
              localAjs.status
            )
          "
        >
          <div>
            <div class="font-weight-bold" style="font-size: 18px">
              {{ localAjs?.jobStep?.step_name }}
              <v-chip
                v-if="localAjs.status === 'ACCEPTED'"
                color="success"
                size="small"
                class="ml-2"
                variant="flat"
              >
                Approved
              </v-chip>
              <v-chip
                v-if="localAjs.status === 'FAILED'"
                color="error"
                size="small"
                class="ml-2"
                variant="flat"
              >
                Rejected
              </v-chip>
            </div>
            <div class="mt-2" style="color: #757575">
              Here are the interview details. Kindly confirm that you have
              reached out to the candidate with the relevant information through
              email or phone.
            </div>
            <div class="mt-2" style="color: #757575">
              {{ localAjs.jobStep.description }}
            </div>
          </div>
          <div>
            <v-btn
              variant="outlined"
              min-width="120"
              color="primary"
              rounded="lg"
              class="mt-8"
              @click="handleSetSchedule"
              >Edit</v-btn
            >
          </div>
        </div>

        <v-divider class="my-4" />
        <template v-if="localAjs?.attributes">
          <v-row
            class="mb-3"
            v-if="
              localAjs.attributes &&
              !['CURRENT', 'PENDING'].includes(localAjs.status)
            "
          >
            <v-col cols="6">
              <div class="font-weight-medium">Contact Person</div>
              <div class="text-grey-darken-1" style="font-size: 12px">
                {{ localAjs.attributes.pic_name }}
                (<a
                  :href="`mailto:${localAjs.attributes.pic_email}`"
                  class="text-primary text-decoration-none"
                  target="_blank"
                >
                  {{ localAjs.attributes.pic_email }} </a
                >)
              </div>
            </v-col>
            <v-col cols="4">
              <div class="font-weight-medium">PIC Phone Number</div>
              <div class="text-grey-darken-1" style="font-size: 12px">
                <template v-if="localAjs.attributes.pic_phone_number">
                  <a
                    :href="`tel:${localAjs.attributes.pic_phone_number}`"
                    class="text-grey-darken-1"
                    target="_blank"
                  >
                    {{ localAjs.attributes.pic_phone_number || "-" }}
                  </a>
                </template>
                <template v-else> - </template>
              </div>
            </v-col>
          </v-row>
          <div class="mb-3">
            <div
              class="mb-4"
              v-if="
                localAjs.attributes.interviewer_list?.filter((i) => i.is_show)
                  .length > 0
              "
            >
              <div class="font-weight-medium">Interviewer</div>
              <template
                v-for="(interviewer, index) in localAjs.attributes
                  .interviewer_list"
                :key="interviewer.name"
              >
                <p
                  v-if="interviewer.is_show && interviewer.name"
                  class="text-grey-darken-1"
                  style="font-size: 12px"
                >
                  {{ interviewer.name }}
                  (<template v-if="interviewer.email">
                    <a
                      :href="`mailto:${interviewer.email}`"
                      class="text-primary"
                      target="_blank"
                    >
                      {{ interviewer.email }}
                    </a>
                  </template>

                  <template v-if="interviewer.phone_number">
                    |
                    <a
                      :href="`tel:${interviewer.phone_number}`"
                      class="text-grey-darken-1"
                      target="_blank"
                    >
                      {{ interviewer.phone_number }}
                    </a> </template
                  >)
                </p>
              </template>
            </div>

            <v-row>
              <v-col cols="6">
                <div class="font-weight-medium">Date</div>
                <div class="text-grey-darken-1" style="font-size: 12px">
                  {{
                    new Date(
                      localAjs.attributes.interview_date_time
                    ).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  }}
                </div>
              </v-col>
              <v-col cols="6" v-if="localAjs.attributes.interview_time">
                <div class="font-weight-medium">
                  Time (Adjusted to Your Timezone)
                </div>
                <div class="text-grey-darken-1" style="font-size: 12px">
                  {{ formatTime(localAjs.attributes.interview_date_time) }}
                </div>
              </v-col>
            </v-row>
            <template
              v-if="
                ['online', 'ONLINE'].includes(
                  localAjs.attributes.interview_type
                )
              "
            >
              <div class="my-4">
                <div class="mb-4">
                  <div class="font-weight-medium">Interview Type</div>
                  <div class="text-grey-darken-1" style="font-size: 12px">
                    Online
                  </div>
                </div>

                <div>
                  <div class="font-weight-medium">Link</div>
                  <div class="text-grey-darken-1" style="font-size: 12px">
                    <a
                      :href="localAjs.attributes.link_online"
                      class="text-primary text-decoration-none"
                      target="_blank"
                    >
                      {{ localAjs.attributes.link_online || "-" }}
                    </a>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="my-6">
                <div class="font-weight-medium">Interview Type</div>
                <div class="text-grey-darken-1" style="font-size: 12px">
                  Offline
                </div>
              </div>

              <v-row>
                <v-col cols="4">
                  <div class="font-weight-medium">Country</div>
                  <div class="text-grey-darken-1" style="font-size: 12px">
                    {{
                      localAjs.attributes.offline_is_outside_indo
                        ? localAjs.attributes.offline_other_country || "-"
                        : "Indonesia"
                    }}
                  </div>
                </v-col>

                <v-col cols="4">
                  <div class="font-weight-medium">City</div>
                  <div class="text-grey-darken-1" style="font-size: 12px">
                    <template
                      v-if="localAjs.attributes.offline_is_outside_indo"
                    >
                      {{ localAjs.attributes.offline_other_region }}
                    </template>
                    <template v-else>
                      {{
                        regions.find(
                          (r) => r.id === localAjs.attributes.offline_region_id
                        )?.full_name
                      }}
                    </template>
                  </div>
                </v-col>

                <v-col cols="4" v-if="localAjs.attributes.offline_postal_code">
                  <div class="font-weight-medium">Postal Code</div>
                  <div class="text-grey-darken-1" style="font-size: 12px">
                    {{ localAjs.attributes.offline_postal_code }}
                  </div>
                </v-col>
              </v-row>

              <div class="my-6" v-if="localAjs.attributes.offline_address">
                <div class="font-weight-medium">Address</div>
                <div class="text-grey-darken-1" style="font-size: 12px">
                  {{ localAjs.attributes.offline_address }}
                </div>
              </div>

              <div v-if="localAjs.attributes.offline_maps">
                <div class="font-weight-medium">Maps</div>
                <div class="text-grey-darken-1" style="font-size: 12px">
                  <a
                    :href="localAjs.attributes.offline_maps"
                    class="text-primary text-decoration-none"
                    target="_blank"
                  >
                    {{ localAjs.attributes.offline_maps }}
                  </a>
                </div>
              </div>
            </template>
            <div v-if="localAjs.attributes.notes_applicant_interview">
              <div class="font-weight-medium">Notes</div>
              <div class="text-grey-darken-1" style="font-size: 12px">
                {{ localAjs.attributes.notes_applicant_interview }}
              </div>
            </div>
          </div>
        </template>
      </template>
    </v-card-text>
  </v-card>

  <div
    class="bottom-nav"
    v-if="!['ACCEPTED', 'FAILED'].includes(localAjs?.status)"
  >
    <v-container class="d-flex justify-end align-center">
      <template v-if="['CURRENT', 'PENDING'].includes(localAjs.status)">
        <v-btn
          variant="outlined"
          color="primary"
          class="mr-4"
          :loading="rejectLoading"
          rounded="lg"
          @click="handleReject"
          style="font-weight: bold"
        >
          REJECT
        </v-btn>
        <v-btn
          color="primary"
          class="text-white"
          style="font-weight: bold"
          rounded="lg"
          @click="handleSetSchedule"
        >
          SET SCHEDULE
        </v-btn>
      </template>
      <template v-else>
        <v-btn
          color="primary"
          class="text-white"
          style="font-weight: bold"
          rounded="lg"
          :disabled="['SKIPPED'].includes(localAjs.status)"
          @click="handleReview"
        >
          REVIEW
        </v-btn>
      </template>
      <v-menu v-if="localAjs.id == applicant.last_applicant_job_step_id">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="outlined"
            rounded="lg"
            size="small"
            color="primary"
            v-bind="props"
            class="ml-2"
            height="36"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openMoveDialog" style="cursor: pointer">
            <v-list-item-title>Move Candidate</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-container>
  </div>

  <v-dialog v-model="showScheduleDialog" max-width="600" scrollable>
    <v-form @submit.prevent="saveSchedule" ref="form">
      <v-card rounded="lg">
        <v-toolbar class="bg-transparent" density="compact">
          <v-toolbar-title class="font-weight-bold"
            >Interview Schedule
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" @click="showScheduleDialog = false" />
        </v-toolbar>
        <v-divider />
        <v-card-text>
          <v-card
            elevation="0"
            class="mb-4"
            rounded="lg"
            style="border: 1px solid #e0e0e0"
          >
            <v-card-text>
              <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                Interview Name
              </div>
              <v-text-field
                v-model="localAjs.jobStep.step_name"
                placeholder="Interview Name"
                disabled
                rounded="lg"
                variant="outlined"
                density="compact"
              />
              <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                Description
              </div>
              <v-textarea
                v-model="localAjs.jobStep.description"
                placeholder="Description"
                rounded="lg"
                variant="outlined"
                density="compact"
                hide-details="auto"
                rows="2"
                auto-grow
                style="white-space: pre-wrap !important; resize: vertical"
              />
            </v-card-text>
          </v-card>

          <v-card
            elevation="0"
            class="mb-4"
            rounded="lg"
            style="border: 1px solid #e0e0e0"
          >
            <v-card-text>
              <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                Person In Charge / Main Contact Person
              </div>
              <!-- Replace v-autocomplete with custom implementation -->
              <div class="position-relative">
                <v-text-field
                  v-model="postData.pic_name"
                  class="mb-2"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Search and select person in charge or type name"
                  :rules="[
                    (v) => !!v || 'Please input Person In Charge\'s name',
                  ]"
                  @keyup.prevent="searchPIC($event.target.value)"
                  @focus="showPICDropdown = true"
                  @blur="handlePICBlur"
                  clearable
                >
                  <template v-slot:append-inner>
                    <v-icon
                      :class="{ 'rotate-180': showPICDropdown }"
                      style="transition: transform 0.2s"
                    >
                      mdi-chevron-down
                    </v-icon>
                  </template>
                </v-text-field>

                <!-- Custom dropdown -->
                <v-card
                  v-if="showPICDropdown && getFilteredPIC()?.length > 0"
                  :loading="interviewerLoading"
                  class="position-absolute py-0"
                  style="
                    z-index: 1000;
                    width: 100%;
                    max-height: 200px;
                    overflow-y: auto;
                    top: calc(100% - 20px);
                  "
                  elevation="8"
                  rounded="lg"
                >
                  <v-list density="compact">
                    <v-list-item
                      v-for="item in getFilteredPIC()"
                      :key="item.id"
                      @click="selectPIC(item)"
                      class="cursor-pointer"
                    >
                      <v-list-item-title>{{
                        item.displayText
                      }}</v-list-item-title>
                      <v-list-item-subtitle>{{
                        item.email
                      }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </div>
              <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                Email
              </div>
              <v-text-field
                v-model="postData.pic_email"
                class="mb-2"
                variant="outlined"
                density="compact"
                rounded="lg"
                placeholder="Input Person In Charge's email"
                :rules="[
                  (v) => !!v || 'Please input Person In Charge\'s email',
                  (v) =>
                    /.+@.+\..+/.test(v) || 'Please input valid email address',
                ]"
              />
              <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                Phone Number
              </div>
              <v-phone-field
                v-model="postData.pic_phone_number"
                variant="outlined"
                density="compact"
                rounded="lg"
                placeholder="Input Person In Charge's number"
                :rules="[
                  (v) => !!v || 'Please input Person In Charge\'s phone number',
                  (v) =>
                    !v ||
                    /^[0-9]{9,13}$/.test(v) ||
                    'Phone number must be 9-13 digits',
                ]"
                default-country="ID"
                type="tel"
                :isSignup="false"
              />
            </v-card-text>
          </v-card>

          <v-card
            elevation="0"
            class="mb-4"
            rounded="lg"
            style="border: 1px solid #e0e0e0"
          >
            <template
              v-for="(interviewer, index) in postData.interviewer_list"
              :key="index"
            >
              <v-card-text>
                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Interviewer
                  <template v-if="index > 0">{{ index + 1 }}</template>
                </div>

                <!-- Replace v-autocomplete with custom implementation -->
                <div class="position-relative">
                  <v-text-field
                    v-model="interviewer.name"
                    class="mb-2"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    placeholder="Search and select interviewer or type name"
                    :rules="[(v) => !!v || 'Please input Interviewer\'s name']"
                    @keyup.prevent="
                      searchInterviewers(index, $event.target.value)
                    "
                    @focus="showDropdown[index] = true"
                    @blur="handleInterviewerBlur(index)"
                    clearable
                  >
                    <template v-slot:append-inner>
                      <v-icon
                        :class="{ 'rotate-180': showDropdown[index] }"
                        style="transition: transform 0.2s"
                      >
                        mdi-chevron-down
                      </v-icon>
                    </template>
                  </v-text-field>

                  <!-- Custom dropdown -->
                  <v-card
                    v-if="
                      showDropdown[index] &&
                      getFilteredInterviewers(index)?.length > 0
                    "
                    :loading="interviewerLoading"
                    class="position-absolute py-0"
                    style="
                      z-index: 1000;
                      width: 100%;
                      max-height: 200px;
                      overflow-y: auto;
                      top: calc(100% - 20px);
                    "
                    elevation="8"
                    rounded="lg"
                  >
                    <v-list density="compact">
                      <v-list-item
                        v-for="item in getFilteredInterviewers(index)"
                        :key="item.id"
                        @click="selectInterviewer(index, item)"
                        class="cursor-pointer"
                      >
                        <v-list-item-title>{{
                          item.displayText
                        }}</v-list-item-title>
                        <v-list-item-subtitle>{{
                          item.email
                        }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </div>

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Email
                </div>
                <v-text-field
                  v-model="interviewer.email"
                  class="mb-2"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Input Interviewer's email"
                  :rules="[
                    (v) => !!v || 'Please input Interviewer\'s email',
                    (v) =>
                      /.+@.+\..+/.test(v) || 'Please input valid email address',
                  ]"
                />

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Phone Number (Optional)
                </div>
                <v-phone-field
                  v-model="interviewer.phone_number"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Input Interviewer's number"
                  :rules="[
                    (v) =>
                      !v ||
                      /^[0-9]{9,13}$/.test(v) ||
                      'Phone number must be 9-13 digits',
                  ]"
                  default-country="ID"
                  type="tel"
                  :isSignup="false"
                />
                <div
                  class="d-flex align-center justify-space-between pr-2 mb-2"
                >
                  <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                    Show Interviewer ?
                  </div>
                  <v-switch
                    v-model="interviewer.is_show"
                    color="primary"
                    density="compact"
                    class=""
                    hide-details
                    rounded="lg"
                  />
                </div>

                <div class="d-flex justify-space-between" v-if="index > 0">
                  <v-spacer />
                  <v-btn
                    v-if="postData.interviewer_list.length > 1"
                    variant="outlined"
                    rounded="lg"
                    color="error"
                    @click="removeInterviewer(index)"
                    >DELETE</v-btn
                  >
                </div>
              </v-card-text>
              <v-divider />
            </template>
            <v-card-text class="pa-1">
              <v-btn
                variant="text"
                rounded="lg"
                color="primary"
                @click="addInterviewer"
                ><v-icon class="mr-3">mdi-plus</v-icon> Add Interviewer</v-btn
              >
            </v-card-text>
          </v-card>

          <v-card
            elevation="0"
            class="mb-4"
            rounded="lg"
            style="border: 1px solid #e0e0e0"
          >
            <v-card-text>
              <v-row class="mb-2">
                <v-col cols="12" md="6">
                  <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                    Interview Date
                  </div>

                  <v-text-field
                    v-model="postData.interview_date"
                    type="date"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    :min="new Date().toISOString().split('T')[0]"
                    :rules="[
                      (v) => !!v || 'Interview date is required',
                      (v) =>
                        new Date(v) >= new Date().setHours(0, 0, 0, 0) ||
                        'Interview date cannot be in the past',
                    ]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                    Interview Time (Optional)
                  </div>
                  <v-text-field
                    v-model="postData.interview_time"
                    type="time"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hint="Adjusted to your device local timezone"
                  />
                </v-col>
              </v-row>

              <template>
                <div class="mb-1 text-grey-darken-1" style="font-size: 12px">
                  Candidates Email
                </div>
                <v-text-field
                  v-model="postData.recipient_to"
                  class="mb-2"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Input candidates email"
                  :rules="[
                    (v) =>
                      !v ||
                      /.+@.+\..+/.test(v) ||
                      'Please input valid email address',
                  ]"
                />
              </template>

              <div>
                <div class="mb-1 text-grey-darken-1" style="font-size: 12px">
                  Interview Type
                </div>
                <v-radio-group v-model="postData.interview_type" inline>
                  <v-radio label="Online" value="ONLINE" />
                  <v-radio label="Offline" value="OFFLINE" />
                </v-radio-group>
              </div>

              <template v-if="postData.interview_type === 'OFFLINE'">
                <v-row align="center" class="mb-2">
                  <v-col>
                    <span class="text-grey-darken-1" style="font-size: 12px">
                      Outside Indonesia ?
                    </span>
                  </v-col>
                  <v-col cols="auto">
                    <v-switch
                      v-model="postData.offline_is_outside_indo"
                      density="compact"
                      rounded="lg"
                      hide-details
                      color="primary"
                    />
                  </v-col>
                </v-row>

                <template v-if="postData.offline_is_outside_indo">
                  <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                    Country
                  </div>
                  <v-text-field
                    v-model="postData.offline_other_country"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    placeholder="Input country"
                    :rules="[(v) => !!v || 'Country is required']"
                  />
                  <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                    Region
                  </div>
                  <v-text-field
                    v-model="postData.offline_other_region"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    placeholder="Input city"
                    :rules="[(v) => !!v || 'Region is required']"
                  />
                </template>
                <template v-else>
                  <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                    City
                  </div>
                  <v-autocomplete
                    v-model="postData.offline_region_id"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Search and select city"
                    :items="regions"
                    item-title="name"
                    item-value="id"
                    :loading="regionLoading"
                    :search-input.sync="citySearch"
                    :rules="[
                      (v) =>
                        postData.offline_is_outside_indo ||
                        !!v ||
                        'City is required',
                    ]"
                    @update:search="searchCities"
                    rounded="lg"
                  />
                </template>

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Address
                </div>
                <v-textarea
                  v-model="postData.offline_address"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Input your full address"
                  :rules="[(v) => !!v || 'Address is required']"
                  auto-grow
                  style="white-space: pre-wrap !important; resize: vertical"
                />

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Postal Code (Optional)
                </div>
                <v-text-field
                  v-model="postData.offline_postal_code"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Input postal code"
                />

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Maps (Optional)
                </div>
                <v-text-field
                  v-model="postData.offline_maps"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  placeholder="Input maps link"
                />

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Notes (Optional)
                </div>
                <v-textarea
                  v-model="postData.notes_applicant_interview"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  hide-details="auto"
                  placeholder="Enter interview details or instructions for the candidate here"
                  auto-grow
                  style="white-space: pre-wrap !important; resize: vertical"
                />
              </template>

              <template v-if="postData.interview_type === 'ONLINE'">
                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Link Online
                </div>
                <v-text-field
                  v-model="postData.link_online"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  class="mb-2"
                  placeholder="Input link online"
                  :rules="[(v) => !!v || 'Online link is required']"
                />

                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Notes (Optional)
                </div>
                <v-textarea
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  v-model="postData.notes_applicant_interview"
                  placeholder="Enter interview details or instructions for the candidate here"
                  hide-details="auto"
                  auto-grow
                  style="white-space: pre-wrap !important; resize: vertical"
                />
              </template>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-4">
          <v-row>
            <v-col cols="6">
              <v-btn
                block
                variant="outlined"
                @click="showScheduleDialog = false"
                rounded="lg"
                >Cancel</v-btn
              >
            </v-col>
            <v-col cols="6" class="d-flex justify-end">
              <v-btn
                block
                variant="flat"
                color="primary"
                rounded="lg"
                @click="saveSchedule"
                :loading="saveLoading"
                >Save</v-btn
              >
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>

  <v-dialog v-model="showResultDialog" max-width="600" scrollable>
    <v-card rounded="lg">
      <v-toolbar class="bg-transparent" density="compact">
        <v-toolbar-title class="font-weight-bold"
          >Interview Result</v-toolbar-title
        >
        <v-spacer />
        <v-btn icon="mdi-close" @click="showResultDialog = false" />
      </v-toolbar>
      <v-divider />
      <v-card-text>
        <div class="d-flex align-center mb-4" style="gap: 16px">
          <v-avatar size="56" rounded="lg">
            <v-img :src="BASE_URL + user.photo_url" />
          </v-avatar>
          <div>
            <div class="font-weight-bold" style="font-size: 20px">
              {{ user.full_name }}
            </div>
            <div style="color: #757575">
              Applied for {{ applicant.job.title }}
            </div>
          </div>
        </div>
        <div class="mb-2" style="color: #757575">Notes (Optional)</div>
        <v-textarea
          v-model="postData.notes_interview_results"
          placeholder="Write your assessment or feedback regarding the interview outcome"
          rows="4"
          variant="outlined"
          rounded="lg"
          auto-grow
          style="white-space: pre-wrap !important; resize: vertical"
        />
        <div class="text-grey-darken-2 mb-1">
          <small>Upload Result File (optional)</small>
        </div>
        <v-file-upload
          placeholder="Upload File (max size 5 MB)"
          v-model="postData.attachment_interview_results"
          category="result_interview"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
          class="mb-4"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-6 py-4 d-flex justify-end">
        <v-btn
          variant="outlined"
          color="primary"
          class="mr-2"
          :loading="rejectLoading"
          @click="handleReject"
          rounded="lg"
          style="font-weight: bold"
          >REJECT</v-btn
        >
        <v-btn
          color="primary"
          class="text-white"
          :loading="acceptLoading"
          @click="handleAccept"
          rounded="lg"
          variant="flat"
          style="font-weight: bold"
          >APPROVE</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="moveDialog" max-width="700">
    <v-card rounded="lg">
      <v-card-title class="px-6 font-weight-bold d-flex align-center">
        Move Candidate
        <v-spacer />
        <v-btn icon @click="closeMoveDialog" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="pt-0">
        <div class="mb-4 text-grey-darken-1" style="font-size: 14px">
          By moving candidate stage you can skip recruitment steps you find
          unnecessary for certain candidates
        </div>
        <div class="d-flex align-center mb-3">
          <v-avatar size="66" rounded="lg" class="bg-grey-lighten-3 mr-4">
            <v-img
              v-if="user.photo_url"
              :src="
                user.photo_url.includes('http')
                  ? user.photo_url
                  : BASE_URL + user.photo_url
              "
              cover
            />
            <div
              v-else
              class="d-flex align-center justify-center"
              style="height: 100%"
            >
              <span class="text-h3">{{ getInitials(user.full_name) }}</span>
            </div>
          </v-avatar>

          <!-- Profile Info -->
          <div class="mt-2 mb-2 pl-1">
            <!-- Badges -->
            <div class="d-flex gap-2 mb-1">
              <h3 class="font-weight-bold">
                {{ user.full_name || "(not set)" }}
              </h3>
              <div class="d-flex gap-2" style="margin-top: 2px">
                <v-img
                  v-if="user.is_skill_passport_verified"
                  src="/images/asp-badge.svg"
                  width="24"
                  height="24"
                ></v-img>
                <v-avatar
                  color="brown"
                  size="24"
                  v-if="user.is_school_verified"
                >
                  <v-icon size="20">mdi-school-outline</v-icon>
                </v-avatar>

                <v-chip
                  style="display: none"
                  class="ml-2"
                  size="small"
                  color="primary"
                  variant="outlined"
                >
                  3 / 10 Skill Match
                </v-chip>
              </div>
            </div>

            <!-- Contact Info -->
            <div
              class="gap-4 text-subtitle-2 text-grey-darken-1"
              :class="{ 'd-flex': isDesktop, 'd-block': isMobile }"
            >
              <div class="d-flex align-center text-caption">
                <a
                  :href="`tel:${user.phone}`"
                  target="_blank"
                  class="text-grey-darken-1"
                >
                  <v-icon color="primary">mdi-phone-outline</v-icon>
                  {{ user.phone }}
                </a>
              </div>
              <div class="d-flex align-center">
                <a
                  :href="`mailto:${user.email}`"
                  target="_blank"
                  class="text-grey-darken-1"
                >
                  <v-icon color="primary">mdi-email-outline</v-icon>
                  {{ user.email }}
                </a>
              </div>
              <router-link
                :to="`/admin/jobs/employer/${route.params.jobId}/${route.params.userId}`"
                target="_blank"
                variant="text"
                class="pa-0 px-2font-weight-bold"
                color="primary"
                density="compact"
              >
                <v-icon start>mdi-open-in-new</v-icon>
                Candidate Profile
              </router-link>
            </div>
          </div>
        </div>

        <div class="mb-2 text-caption text-grey">
          Updated on
          {{
            new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          }}
        </div>

        <div class="mb-1 text-grey-darken-1" style="font-size: 12px">
          Recruitment Stage
        </div>
        <v-select
          variant="outlined"
          rounded="lg"
          v-model="selectedStage"
          :items="stages"
          placeholder="Choose Destination Stage"
          item-title="name"
          density="comfortable"
          item-value="id"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="outlined" rounded="lg" @click="closeMoveDialog"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          rounded="lg"
          variant="flat"
          min-width="120"
          @click="handleMoveCandidate"
          :disabled="!selectedStage"
          :loading="moveLoading"
          >Move</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth", "employer-jobs"],
});

import FillmentPreview from "~/components/detail-fulfillment-preview.vue";
// Props
const props = defineProps({
  me: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  user: {
    type: Object,
    required: true,
    default: () => ({ phone: "" }),
  },
  applicant: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  ajs: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const { isMobile, isDesktop } = useScreenSize();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const { $apiFetch } = useApi();
const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const citySearch = ref("");
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

const emit = defineEmits(["update:ajs", "update:tab"]);
const localAjs = ref({ ...props.ajs });
const stages = ref([]);
const selectedStage = ref(null);

watch(
  () => props.ajs?.status,
  (newStatus) => {
    if (!props.ajs) return;

    localAjs.value = { ...props.ajs };
    if (localAjs.value.attributes?.offline_region_id) {
      fetchRegions(localAjs.value.attributes.offline_region_id, "id");
    }

    if (!props.applicant?.applicantJobSteps) return;

    stages.value = props.applicant.applicantJobSteps
      .filter((step) => step.id != localAjs.value.id)
      .map((step) => ({
        id: step.id,
        name: step.jobStep?.step_name || "Unknown Step",
      }));
  },
  { immediate: true }
);

onMounted(() => {
  localAjs.value = { ...props.ajs };
  postData.value = Object.assign(
    {},
    props.ajs.attributes || props.ajs.jobStep.attributes
  );
});

const snackbar = useSnackbarStore();
const acceptLoading = ref(false);
const rejectLoading = ref(false);
const currentLoading = ref(false);
const rejectRescheduleLoading = ref(false);
const acceptRescheduleLoading = ref(false);

const handleRejectReschedule = async () => {
  rejectRescheduleLoading.value = true;
  postData.value.reschedule_request = "REJECTED";
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "SCHEDULED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Reschedule request rejected",
      color: "error",
    });
    localAjs.value.status = response.status;
    localAjs.value.attributes = response.attributes;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    rejectRescheduleLoading.value = false;
  }
};

const showRescheduleDialog = ref(false);
const handleAcceptReschedule = async () => {
  showScheduleDialog.value = true;
  showRescheduleDialog.value = true;
};

const handleAcceptReschedule2 = async () => {
  acceptRescheduleLoading.value = true;
  postData.value.reschedule_request = "ACCEPTED";
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "RESCHEDULED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Reschedule request accepted",
      color: "success",
    });
    localAjs.value.status = response.status;
    localAjs.value.attributes = response.attributes;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    acceptRescheduleLoading.value = false;
  }
};

const handleCurrent = async () => {
  currentLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "CURRENT",
      },
    });
    snackbar.showSnackbar({
      message: "Application set to current",
      color: "success",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    currentLoading.value = false;
  }
};

const handleAccept = async () => {
  acceptLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "ACCEPTED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Application accepted",
      color: "success",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
    showResultDialog.value = false;
  } catch (error) {
  } finally {
    acceptLoading.value = false;
  }
};

const dialog = useDialogStore();
const handleReject = async () => {
  await dialog.openDialog({
    title: "Reject Application",
    message: "Are you sure you want to reject the candidate?",
    confirmButtonText: "Reject",
    confirmButtonColor: "error",
    cancelButtonText: "No",
    autoClose: false,
  });
  dialog.loading = true;
  rejectLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "FAILED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Application rejected",
      color: "error",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
    showResultDialog.value = false;
  } catch (error) {
  } finally {
    rejectLoading.value = false;
    dialog.closeDialog();
  }
};

const handleSetSchedule = () => {
  postData.value = Object.assign(
    {},
    props.ajs.attributes || props.ajs.jobStep.attributes
  );
  postData.value.offline_region_id = postData.value.offline_region_id || null;
  if (postData.value.offline_region_id) {
    fetchRegions(postData.value.offline_region_id, "id");
  }
  if (!postData.value.recipient_to) {
    postData.value.recipient_to = props.user.email;
  }
  if (!postData.value.interviewer_list) {
    postData.value.interviewer_list = [
      { name: "", email: "", phone_number: "", is_show: true },
    ];
  }
  showScheduleDialog.value = true;
  if (!postData.value.pic_name) {
    postData.value.pic_name = props.me.full_name;
  }
  if (!postData.value.pic_phone_number) {
    postData.value.pic_phone_number =
      props.me.phone || postData.value.pic_phone_number;
  }
  if (!postData.value.pic_email) {
    postData.value.pic_email = props.me.email || postData.value.pic_email;
  }
};

const addInterviewer = () => {
  postData.value.interviewer_list = postData.value.interviewer_list || [];
  const newIndex = postData.value.interviewer_list.length;
  postData.value.interviewer_list.push({
    name: "",
    email: "",
    phone_number: "",
    is_show: true,
    user_id: null,
  });

  // Initialize dropdown state for new interviewer
  showDropdown.value[newIndex] = false;
};

const removeInterviewer = (index) => {
  postData.value.interviewer_list.splice(index, 1);
};

const showScheduleDialog = ref(false);
watch(
  () => showScheduleDialog.value,
  (newVal) => {
    if (!newVal) {
      showRescheduleDialog.value = false;
    }
  }
);
const dateMenu = ref(false);
const timeMenu = ref(false);

const postData = ref(
  Object.assign(
    {},
    props.ajs.jobStep.attributes || {
      recipient_to: "",
      recipient_bcc: "",
      pic_name: "",
      pic_phone_number: "",
      pic_email: "",
      interviewer_list: [
        {
          name: "",
          phone_number: "",
          email: "",
          is_show: true,
          user_id: null,
        },
      ],
      interview_date: "",
      interview_date_time: "",
      interview_time: "",
      interview_timezone: "",
      interview_type: "",
      link_online: "",
      link_offline: "",
      offline_region_id: "",
      offline_is_outside_indo: "",
      offline_other_country: "",
      offline_other_region: "",
      offline_address: "",
      notes_applicant_interview: "",
      notes_interview_results: "",
      attachment_interview_results: "",
      reschedule_request: "",
      reschedule_request_notes_from_candidate: "",
    }
  )
);

const descriptionUpdated = ref(false);
watch(
  () => localAjs.value.jobStep.description,
  (newVal, oldVal) => {
    if (newVal != oldVal) {
      descriptionUpdated.value = true;
    }
  }
);

const saveLoading = ref(false);
const form = ref(null);
const saveSchedule = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    snackbar.showSnackbar({
      message: "Please fill all required fields",
      color: "error",
    });
    return;
  }
  saveLoading.value = true;
  postData.value.interview_date_time = `${postData.value.interview_date} ${
    postData.value.interview_time || "00:00"
  }`;
  postData.value.interview_timezone = getTimezoneName();

  if (showRescheduleDialog.value) {
    acceptRescheduleLoading.value = true;
    postData.value.reschedule_request = "ACCEPTED";
  }
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status:
          showRescheduleDialog.value ||
          ["SCHEDULED", "RESCHEDULED"].includes(props.ajs.status)
            ? "RESCHEDULED"
            : "SCHEDULED",
        attributes: postData.value,
      },
    });
    localAjs.value.status = response.status;
    localAjs.value.attributes = response.attributes;
    emit("update:ajs", localAjs.value);
    showScheduleDialog.value = false;
    snackbar.showSnackbar({
      message: "Interview schedule saved",
      color: "success",
    });

    if (descriptionUpdated.value) {
      await $apiFetch(`/applicants/${props.applicant.id}`, {
        method: "PATCH",
        body: {
          description: localAjs.value.jobStep.description,
          applicant_job_step_id: props.ajs.id,
        },
      });
      descriptionUpdated.value = false;
    }
  } catch (error) {
    console.log(error);
  } finally {
    saveLoading.value = false;
    acceptRescheduleLoading.value = false;
  }
};

const showResultDialog = ref(false);

const handleReview = () => {
  showResultDialog.value = true;
  postData.value.attachment_interview_results =
    postData.value.attachment_interview_results || null;
};

const moveDialog = ref(false);
const openMoveDialog = () => {
  moveDialog.value = true;
};
const closeMoveDialog = () => {
  moveDialog.value = false;
  selectedJob.value = null;
  selectedStage.value = null;
};
const moveLoading = ref(false);
const handleMoveCandidate = async () => {
  moveLoading.value = true;
  try {
    if (!selectedStage.value) {
      snackbar.showSnackbar({
        message: "Please select a destination stage",
        color: "error",
      });
      return;
    }
    await $apiFetch(`/applicants/${props.applicant.id}`, {
      method: "PATCH",
      body: {
        last_applicant_job_step_id: selectedStage.value,
      },
    });
    snackbar.showSnackbar({
      message: "Candidate moved successfully!",
      color: "success",
    });
    const dtab = props.applicant.applicantJobSteps.findIndex(
      (step) => step.id == selectedStage.value
    );
    emit("update:tab", dtab);
    closeMoveDialog();
  } catch (error) {
  } finally {
    moveLoading.value = false;
  }
};

// Add interviewer search composable
const {
  interviewers,
  interviewerLoading,
  debouncedFetchInterviewers,
  fetchInterviewers,
} = useInterviewerSearch();

// Add new reactive variables
const showDropdown = ref({});

// Add the new filtering function
const getFilteredInterviewers = (index) => {
  const searchQuery =
    postData.value.interviewer_list[index]?.name?.toLowerCase();

  if (searchQuery) {
    return interviewers.value.filter((interviewer) =>
      interviewer.displayText.toLowerCase().includes(searchQuery)
    );
  }

  return interviewers.value;
};

// Update searchInterviewers method
const searchInterviewers = (index, query) => {
  // Store the search query in name field directly
  postData.value.interviewer_list[index].name = query;

  if (query && query.length > 0) {
    showDropdown.value[index] = true;

    if (props.me?.company_id) {
      debouncedFetchInterviewers(
        query,
        props.me.company_id,
        props.me.company_hq_id,
        ["full_name", "email"]
      );
    } else {
      debouncedFetchInterviewers(query, null, null, ["full_name", "email"]);
    }
  } else {
    showDropdown.value[index] = false;
  }
};

// Update selectInterviewer method to work with the new approach
const selectInterviewer = (index, selectedUser) => {
  console.log("selectedUser", selectedUser, index);
  if (selectedUser) {
    postData.value.interviewer_list[index].name = selectedUser.full_name;
    postData.value.interviewer_list[index].email = selectedUser.email;
    postData.value.interviewer_list[index].phone_number =
      selectedUser.phone || "";
    postData.value.interviewer_list[index].user_id = selectedUser.id;
  }

  // Hide dropdown after selection
  showDropdown.value[index] = false;
};

// Add blur handler function
const handleInterviewerBlur = (index) => {
  setTimeout(() => {
    showDropdown.value[index] = false;
  }, 300);
};

// Add new reactive variables for PIC dropdown
const showPICDropdown = ref(false);

// Add the PIC filtering function
const getFilteredPIC = () => {
  const searchQuery = postData.value.pic_name?.toLowerCase();

  if (searchQuery) {
    return interviewers.value.filter((interviewer) =>
      interviewer.displayText.toLowerCase().includes(searchQuery)
    );
  }

  return interviewers.value;
};

// Add PIC search method
const searchPIC = (query) => {
  // Store the search query in pic_name field directly
  postData.value.pic_name = query;

  if (query && query.length > 0) {
    showPICDropdown.value = true;

    if (props.me?.company_id) {
      debouncedFetchInterviewers(
        query,
        props.me.company_id,
        props.me.company_hq_id,
        ["full_name", "email"]
      );
    } else {
      debouncedFetchInterviewers(query, null, null, ["full_name", "email"]);
    }
  } else {
    showPICDropdown.value = false;
  }
};

// Add PIC selection method
const selectPIC = (selectedUser) => {
  console.log("selectedPIC", selectedUser);
  if (selectedUser) {
    postData.value.pic_name = selectedUser.full_name;
    postData.value.pic_email = selectedUser.email;
    postData.value.pic_phone_number = selectedUser.phone || "";
  }

  // Hide dropdown after selection
  showPICDropdown.value = false;
};

// Add PIC blur handler function
const handlePICBlur = () => {
  setTimeout(() => {
    showPICDropdown.value = false;
  }, 300);
};

// Add click outside handler to close dropdowns
onMounted(() => {
  localAjs.value = { ...props.ajs };
  postData.value = Object.assign(
    {},
    props.ajs.attributes || props.ajs.jobStep.attributes
  );

  // Initialize interviewer search with company filter
  if (props.me?.company_id) {
    fetchInterviewers("", props.me.company_id);
  }

  // Add global click handler to close dropdowns
  document.addEventListener("click", (e) => {
    // Check if click is outside any dropdown
    const isInsideDropdown = e.target.closest(".v-card");
    const isInsideTextField = e.target.closest(".v-text-field");

    if (!isInsideDropdown && !isInsideTextField) {
      // Close all dropdowns
      Object.keys(showDropdown.value).forEach((key) => {
        showDropdown.value[key] = false;
      });
      showPICDropdown.value = false;
    }
  });
});
</script>

<style scoped>
/* Add any component-specific styles here */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  z-index: 100;
  padding: 4px 0;
}
</style>
