<template>
  <div>
    <!-- Personal Detail Card -->
    <v-card elevation="0" rounded="lg" class="mb-4" style="background: white">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <h4 class="font-weight-bold">Personal Detail</h4>
        <template v-if="!isViewOnly">
          <v-btn
            color="primary"
            variant="outlined"
            rounded="lg"
            height="48"
            :to="{
              path: `/admin/profile/employer/${
                me.wizard_state.find((item) => item.id == 2) ? 2 : 5
              }`,
              query: { edit: 1 },
            }"
          >
            Edit
          </v-btn>
        </template>
      </v-card-title>
      <v-card-text class="pa-4">
        <table style="width: 100%">
          <tbody>
            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Photo</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <v-avatar rounded="lg" size="60" class="bg-grey-lighten-3">
                  <v-img
                    v-if="me.photo_url"
                    :src="
                      me.photo_url.includes('http')
                        ? me.photo_url
                        : BASE_URL + me.photo_url
                    "
                  />
                  <v-icon color="grey-darken-1" v-else size="40"
                    >mdi-account</v-icon
                  >
                </v-avatar>
              </td>
            </tr>
            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Full Name</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ me.full_name }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Date of Birth</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span class="">{{
                  formatDate(me.encrypted_date_of_birth)
                }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Phone</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span class="">{{ me.encrypted_phone }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Email</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span class="">{{ me.email }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Gender</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span class="">{{
                  genders.find((g) => g.name == me.gender)?.label ||
                  me.gender ||
                  "-"
                }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Address</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span class="">{{ me.encrypted_address }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 25%">
                <span class="font-weight-medium">Postal Code</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span class="">{{ me.postal_code }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
    </v-card>

    <!-- Roles Card -->
    <v-card elevation="0" rounded="lg" style="background: white">
      <v-card-title class="pa-4">
        <h4 class="font-weight-bold">Roles ({{ rolesList.length }})</h4>
      </v-card-title>
      <v-card-text class="pa-4">
        <div v-if="rolesList.length === 0" class="text-center py-4">
          <span class="text-grey">No roles assigned</span>
        </div>

        <div
          v-for="(role, index) in rolesList"
          :key="index"
          :class="{ 'mb-6': index < rolesList.length - 1 }"
        >
          <v-divider v-if="index > 0" class="mb-4"></v-divider>

          <table style="width: 100%">
            <tbody>
              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Placement Branch</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{ role.branch_name || "-" }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Role</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{ role.role_label || "-" }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Department</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{ role.department_name || "-" }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Job Title</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{ role.profession || "-" }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Employment Type</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{ role.employment_type || "-" }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Start Date</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{
                    role.start_date ? formatDate(role.start_date) : "-"
                  }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">End Date</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  <span class="">{{ role.end_date || "-" }}</span>
                </td>
              </tr>

              <tr>
                <td valign="top" class="py-2 pr-4" style="width: 25%">
                  <span class="font-weight-medium">Status</span>
                </td>
                <td valign="top" class="pa-1">:</td>
                <td valign="top" class="py-2 pl-2">
                  {{ capitalizeWords(role.status) || "-" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

const props = defineProps({
  genders: {
    type: Array,
    default: () => [],
  },
  me: {
    type: Object,
    default: () => ({}),
  },
  isViewOnly: {
    type: Boolean,
    default: false,
  },
});

// Computed property untuk semua role assignments dari API response
const rolesList = computed(() => {
  const assignments = props.me.assignments;
  if (!assignments || !assignments.length) {
    return [];
  }

  return assignments.map((assignment) => {
    // Capitalize role label
    const roleLabel = assignment.company_role
      ? assignment.company_role
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "-";

    return {
      company_name: assignment.company_name || "-",
      branch_name: assignment.branch || "Headquarters",
      role_label: roleLabel,
      department_name: assignment.dept_name || "-",
      profession: capitalizeWords(assignment.profession_name) || "-",
      employment_type: capitalizeWords(assignment.employment_type) || "-",
      start_date: assignment.start_date || null,
      end_date: assignment.end_date
        ? formatDate(assignment.end_date)
        : "On-going",
      status: assignment.status || "-",
    };
  });
});

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>
