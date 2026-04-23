<template>
  <v-card
    rounded="lg"
    elevation="0"
    style="border: 1px solid #e0e0e0"
    class="mb-4"
  >
    <!-- Reschedule Request -->
    <v-card-text>
      <template v-if="['SCHEDULED', 'RESCHEDULED'].includes(localAjs.status)">
        <template v-if="localAjs.attributes?.reschedule_request == 'REJECTED'">
          <div class="font-weight-bold" style="font-size: 18px">
            Reschedule Request Rejected
            <v-chip color="error" variant="flat" size="small" class="ml-1">
              Rejected</v-chip
            >
          </div>
          <div class="mt-2" style="color: #757575">
            Unfortunately, your request to reschedule the interview has been
            declined. Please contact the employer directly if you have any
            questions or need further assistance.
          </div>
        </template>
        <template
          v-else-if="localAjs.attributes?.reschedule_request == 'ACCEPTED'"
        >
        </template>
        <template v-else>
          <div class="font-weight-bold" style="font-size: 18px">
            Your Interview Time is
            {{ localAjs.status == "RESCHEDULED" ? "Rescheduled" : "Set" }}!
          </div>
          <div class="mt-2" style="color: #757575">
            We've locked in your interview schedule. If it doesn't work for you,
            feel free to request a reschedule—we're happy to accommodate.
          </div>
          <div class="mt-2 text-grey" style="font-size: 12px">
            Applied on {{ formatDate(localAjs.updated_at) }}
          </div>

          <v-btn
            v-if="!localAjs.attributes?.reschedule_request"
            color="primary"
            variant="outlined"
            rounded="lg"
            block
            class="mt-4"
            @click="showRescheduleDialog = true"
            >Request Re-Schedule</v-btn
          >
        </template>
      </template>
      <template
        v-if="
          [
            'SUBMITTED',
            'REVISED',
            'CURRENT',
            'PENDING',
            'RESCHEDULED',
            'SKIPPED',
          ].includes(localAjs.status)
        "
      >
        <template
          v-if="
            ['SCHEDULED', 'REVISED', 'RESCHEDULED'].includes(localAjs.status) &&
            localAjs.attributes?.reschedule_request == 'REQUESTED'
          "
        >
          <div class="font-weight-bold" style="font-size: 18px">
            Your Interview Time Rescheduled Request Sent!
            <v-chip
              color="yellow-darken-1"
              variant="flat"
              size="small"
              class="ml-1"
            >
              Requested
            </v-chip>
          </div>
          <div class="mt-2" style="color: #757575">
            Your interview reschedule request has been sent. Please wait for the
            employer's response.
          </div>
        </template>
        <template
          v-else-if="
            ['SCHEDULED', 'REVISED', 'RESCHEDULED'].includes(localAjs.status) &&
            localAjs.attributes?.reschedule_request == 'ACCEPTED'
          "
        >
          <div class="font-weight-bold" style="font-size: 18px">
            Interview Rescheduled
            <v-chip color="success" variant="flat" size="small" class="ml-1">
              Approved
            </v-chip>
          </div>
          <div class="mt-2" style="color: #757575">
            Your interview has been successfully rescheduled. The new date and
            time have been set. Please check your updated schedule for the
            details.
          </div>
        </template>
        <template v-else>
          <template
            v-if="['CURRENT', 'PENDING', 'SKIPPED'].includes(localAjs.status)"
          >
            <div class="font-weight-bold" style="font-size: 20px">
              Interview Schedule
              <v-chip
                v-if="localAjs.status == 'SKIPPED'"
                :color="colorAjsStatus(localAjs.status, 'candidate', true)"
                variant="flat"
                size="small"
                class="ml-1"
              >
                {{ labelAjsStatus(localAjs.status, "candidate", true) }}
              </v-chip>
            </div>
            <div class="mt-2" style="color: #757575">
              Your interview schedule is currently being arranged. Please wait
              while we confirm the details with the employer. You'll be notified
              once the schedule is finalized.
            </div>
            <div class="mt-2" style="color: #757575">
              {{ localAjs.jobStep.description }}
            </div>
            <div class="mt-2 text-grey" style="font-size: 12px">
              Applied on {{ formatDate(localAjs.updated_at) }}
            </div>
          </template>
        </template>
      </template>

      <div v-if="['ACCEPTED', 'FAILED'].includes(localAjs.status)">
        <div class="font-weight-bold" style="font-size: 20px">
          {{ localAjs.jobStep.step_name }}
          <template v-if="localAjs.status == 'ACCEPTED'"> Qualified </template>
          <template v-else-if="localAjs.status == 'FAILED'">
            Rejected
          </template>
          <template v-else>
            {{ labelAjsStatus(localAjs.status) }}
          </template>

          <v-chip
            :color="colorAjsStatus(localAjs.status)"
            variant="flat"
            size="small"
            class="ml-1"
          >
            {{ labelAjsStatus(localAjs.status) }}
          </v-chip>
        </div>

        <div class="d-flex justify-space-between">
          <div>
            <div class="mt-2" style="color: #757575">
              {{
                localAjs.status === "ACCEPTED"
                  ? "The interview has been completed successfully."
                  : "The interview has been completed but the candidate was not approved."
              }}
            </div>
          </div>
        </div>

        <template>
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
      </div>
    </v-card-text>
  </v-card>
  <v-card
    v-if="
      [
        'SUBMITTED',
        'REVISED',
        'SCHEDULED',
        'RESCHEDULED',
        'ACCEPTED',
        'FAILED',
      ].includes(localAjs.status)
    "
    rounded="lg"
    elevation="0"
    style="border: 1px solid #e0e0e0"
  >
    <v-card-text>
      <div class="font-weight-bold" style="font-size: 18px">
        {{ localAjs.jobStep.step_name }}
      </div>
      <div class="mt-2" style="color: #757575">
        Here is your interview schedule. The employer will send you additional
        details via email.
      </div>
      <div class="mt-2" style="color: #757575">
        {{ localAjs.jobStep.description }}
      </div>
    </v-card-text>

    <v-card-text class="pt-0" v-if="localAjs.attributes">
      <v-divider class="mb-4" />
      <v-row class="mb-3" v-if="localAjs.attributes.pic_name">
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
                {{ localAjs.attributes.pic_phone_number }}
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
            v-for="(interviewer, index) in localAjs.attributes.interviewer_list"
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
            ['online', 'ONLINE'].includes(localAjs.attributes.interview_type)
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
                  {{ localAjs.attributes.link_online }}
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
                <template v-if="localAjs.attributes.offline_is_outside_indo">
                  {{ localAjs.attributes.offline_other_region || "-" }}
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
    </v-card-text>
  </v-card>

  <v-dialog v-model="showRescheduleDialog" max-width="500">
    <v-card rounded="lg" elevation="0">
      <v-card-title class="font-weight-bold d-flex align-center">
        Reschedule Interview
        <v-spacer />
        <v-btn
          icon
          elevation="0"
          @click="showRescheduleDialog = false"
          size="small"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="text-grey-darken-2" style="font-size: 14px">
          Enter the reason for rescheduling your interview. The employer will
          review your request and get back to you shortly with further details.
        </div>
        <v-textarea
          v-model="localAjs.attributes.reschedule_request_notes_from_candidate"
          placeholder="Please provide the reason for rescheduling your interview."
          rows="4"
          variant="outlined"
          class="mt-4"
          rounded="lg"
          auto-grow
          style="white-space: pre-wrap !important; resize: vertical"
        />
      </v-card-text>
      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          rounded="lg"
          @click="showRescheduleDialog = false"
          >Cancel</v-btn
        >
        <v-btn
          variant="flat"
          rounded="lg"
          color="primary"
          :loading="rescheduleLoading"
          @click="submitReschedule"
          :disabled="
            !localAjs.attributes.reschedule_request_notes_from_candidate
          "
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { formatDate, colorAjsStatus, labelAjsStatus } from "~/utils/format.js";
const { $apiFetch } = useApi();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
// Props
const props = defineProps({
  ajs: {
    type: Object,
    required: true,
  },
  applicant: {
    type: Object,
    required: true,
  },
  tab: {
    type: Number,
    required: true,
  },
});

// Emit event to update parent
const emit = defineEmits(["update:ajs", "update:tab"]);

// Create reactive local data
const localAjs = ref({ ...props.ajs });

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
// Watch for props changes and update local data
watch(
  () => props.ajs.status,
  (newAjs) => {
    console.log(newAjs);

    localAjs.value = { ...props.ajs };
    if (localAjs.value.attributes?.offline_region_id) {
      fetchRegions(localAjs.value.attributes.offline_region_id, "id");
    }
  },
  { immediate: true }
);

const fetchAjs = async () => {
  try {
    const response = await $apiFetch(`/applicant-job-steps/search`, {
      method: "GET",
      params: {
        id: props.ajs.id,
        expands: "jobStep",
      },
    });

    // Update local reactive data
    localAjs.value = response.items[0];

    // Emit the updated data to parent
    emit("update:ajs", response.items[0]);
  } catch (error) {
    console.error("Error fetching AJS:", error);
  }
};

const continueLoading = ref(false);
const handleContinue = async () => {
  continueLoading.value = true;
  emit("update:tab", props.tab + 1);
  continueLoading.value = false;
};

const showRescheduleDialog = ref(false);
const rescheduleLoading = ref(false);

const submitReschedule = async () => {
  rescheduleLoading.value = true;
  try {
    localAjs.value.attributes.reschedule_request = "REQUESTED";
    const response = await $apiFetch(
      `/applicant-job-steps/${localAjs.value.id}`,
      {
        method: "PATCH",
        body: {
          attributes: localAjs.value.attributes,
          status: "REVISED",
        },
      }
    );
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
    showRescheduleDialog.value = false;
  } catch (error) {
  } finally {
    rescheduleLoading.value = false;
  }
};
</script>

<style scoped>
/* Component-specific styles can be added here if needed */
</style>
