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
            <h2 class="font-weight-bold mb-2">Recruitment Stages</h2>
            <div class="text-grey mb-6">
              Fill in the details and get matched with the right talent
            </div>

            <!-- Recruitment Stages List -->
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
                <v-col cols="auto">
                  <v-icon class="drag-handle" color="grey">mdi-lock</v-icon>
                </v-col>
                <v-col>
                  <div class="text-caption text-grey-darken-1">
                    Auto created by system
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

            <draggable
              v-model="stages"
              handle=".drag-handle"
              item-key="id"
              v-else
            >
              <template #item="{ element, index }">
                <v-card
                  elevation="0"
                  rounded="lg"
                  style="border: 1px solid #e0e0e0"
                  class="mb-4"
                >
                  <v-row align="center" class="pa-3">
                    <v-col cols="auto">
                      <v-icon
                        v-if="selectedJob.status == 'DRAFT'"
                        class="drag-handle"
                        color="grey"
                        >mdi-drag</v-icon
                      >
                      <v-icon v-else color="grey">mdi-lock</v-icon>
                    </v-col>
                    <v-col>
                      <div class="text-caption text-grey-darken-1">
                        {{
                          stageOptions.find((i) => i.type === element.type)
                            ?.name
                        }}
                      </div>
                      <div class="font-weight-bold">
                        {{ element.step_name }}
                      </div>
                    </v-col>
                    <v-col
                      cols="auto"
                      class="d-flex align-center"
                      v-if="selectedJob.status == 'DRAFT'"
                    >
                      <v-btn icon @click="editStage(index)" variant="text"
                        ><v-icon>mdi-square-edit-outline</v-icon></v-btn
                      >
                      <v-btn icon @click="removeStage(index)" variant="text"
                        ><v-icon>mdi-trash-can-outline</v-icon></v-btn
                      >
                    </v-col>
                    <v-col cols="auto">
                      <v-btn icon @click="viewStage(index)" variant="text"
                        ><v-icon>mdi-eye</v-icon></v-btn
                      >
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </draggable>

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
                <v-col cols="auto">
                  <v-icon class="drag-handle" color="grey">mdi-lock</v-icon>
                </v-col>
                <v-col>
                  <div class="text-caption text-grey-darken-1">
                    Auto created by system
                  </div>
                  <div class="font-weight-bold">Hired</div>
                </v-col>
              </v-row>
            </v-card>

            <v-menu
              v-model="addStageMenu"
              :close-on-content-click="true"
              offset-y
              v-if="selectedJob.status == 'DRAFT'"
            >
              <template #activator="{ props }">
                <v-btn
                  color="primary"
                  variant="text"
                  class="mb-4 pl-0"
                  v-bind="props"
                >
                  <v-icon left class="mr-2" size="20">mdi-plus</v-icon>
                  Add Stage
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(option, idx) in stageOptions"
                  :key="idx"
                  @click="selectStage(option)"
                >
                  <v-list-item-title>{{ option.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <!-- Add Stage -->

            <!-- Add Stage Dialog -->
            <v-dialog
              v-model="stageDialog"
              persistent
              scrollable
              max-width="600px"
            >
              <v-form ref="stageForm" v-model="isFormValid">
                <v-card
                  elevation="0"
                  rounded="xl"
                  style="border: 1px solid #e0e0e0"
                >
                  <v-toolbar class="bg-transparent">
                    <v-toolbar-title class="">{{
                      stageOptions.find((i) => i.type === newStage.type)?.name
                    }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="stageDialog = false" variant="text"
                      ><v-icon>mdi-close</v-icon></v-btn
                    >
                  </v-toolbar>
                  <v-divider></v-divider>

                  <v-card-text>
                    <v-alert
                      v-if="newStage.type === 'INTERVIEW'"
                      type="info"
                      variant="tonal"
                      class="mb-4"
                      style="font-size: 12px"
                      rounded="lg"
                    >
                      <template #prepend>
                        <v-icon color="primary" size="20" class="mt-1"
                          >mdi-information</v-icon
                        >
                      </template>
                      <div class="text-black">
                        The interview details will be created when you decide to
                        move forward with a candidate.
                      </div>
                    </v-alert>

                    <v-card
                      elevation="0"
                      rounded="xl"
                      class="mb-4"
                      style="border: 1px solid #e0e0e0"
                    >
                      <v-card-text>
                        <div
                          class="text-caption text-grey-darken-1"
                          style="font-size: 12px"
                        >
                          Stage Title
                        </div>
                        <v-text-field
                          v-model="newStage.step_name"
                          :rules="[(v) => !!v || 'Title is required']"
                          required
                          variant="outlined"
                          rounded="lg"
                          density="comfortable"
                          :placeholder="exStagePlaceholder(newStage.type)"
                        ></v-text-field>
                        <div
                          class="text-caption text-grey-darken-1"
                          style="font-size: 12px"
                        >
                          Description
                        </div>
                        <v-textarea
                          v-model="newStage.description"
                          placeholder="What will candidates do in this stage?"
                          rows="2"
                          density="comfortable"
                          variant="outlined"
                          rounded="lg"
                          auto-grow
                          style="
                            white-space: pre-wrap !important;
                            resize: vertical;
                          "
                          :rules="[(v) => !!v || 'Description is required']"
                        ></v-textarea>
                      </v-card-text>
                    </v-card>

                    <!-- Tambahkan bagian ini -->
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
                          <div
                            class="text-caption text-grey-darken-1"
                            style="font-size: 12px"
                          >
                            {{ idx + 1 }}. Question
                          </div>
                          <v-text-field
                            v-model="q.question"
                            placeholder="Enter question"
                            density="comfortable"
                            variant="outlined"
                            rounded="lg"
                            :rules="[(v) => !!v || 'Question is required']"
                          />
                          <div
                            class="text-caption text-grey-darken-1"
                            style="font-size: 12px"
                          >
                            Input Type
                          </div>
                          <v-select
                            v-model="q.type"
                            :items="[
                              {
                                text: 'Description',
                                value: 'TEXT',
                              },
                              {
                                text: 'Checkbox',
                                value: 'CHECKBOX',
                              },
                              {
                                text: 'Radio Button',
                                value: 'RADIO-BUTTON',
                              },
                              {
                                text: 'Dropdown',
                                value: 'DROP-DOWN',
                              },
                              {
                                text: 'Attachment',
                                value: 'ATTACHMENT',
                              },
                              {
                                text: 'Date',
                                value: 'DATE',
                              },
                              {
                                text: 'Time',
                                value: 'TIME',
                              },
                              {
                                text: 'Date & Time',
                                value: 'DATE-TIME',
                              },
                            ]"
                            density="comfortable"
                            variant="outlined"
                            rounded="lg"
                            item-title="text"
                            item-value="value"
                            class="mb-4"
                            hide-details
                            @update:model-value="
                              handleQuestionTypeChange(q, $event)
                            "
                          />

                          <!-- Input & Preview Options -->
                          <div class="mt-2">
                            <!-- Preview -->
                            <template v-if="q.type === 'TEXT'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Description
                              </div>
                              <v-text-field
                                label="Text Field"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                disabled
                                hide-details
                              />
                            </template>
                            <template v-else-if="q.type === 'CHECKBOX'">
                              <div
                                v-for="(opt, optIdx) in q.options"
                                :key="optIdx"
                                class="d-flex align-center"
                              >
                                <v-checkbox
                                  :model-value="false"
                                  density="comfortable"
                                  disabled
                                  hide-details
                                  class="mr-3 my-0 py-0"
                                  style="max-width: 20px; flex-shrink: 0"
                                  :class="q.options[optIdx] ? 'mb-0' : 'mb-5'"
                                />
                                <v-text-field
                                  v-model="q.options[optIdx]"
                                  placeholder="Enter option text"
                                  variant="flat"
                                  density="compact"
                                  rounded="lg"
                                  class="mr-2 pa-0"
                                  height="30"
                                  :rules="[(v) => !!v || 'Option is required']"
                                  style="flex-grow: 1"
                                  :hide-details="!!q.options[optIdx]"
                                />
                                <v-btn
                                  v-if="q.options.length > 1"
                                  icon
                                  size="small"
                                  @click="q.options.splice(optIdx, 1)"
                                  variant="text"
                                  :class="q.options[optIdx] ? 'mb-0' : 'mb-5'"
                                >
                                  <v-icon size="20">mdi-delete</v-icon>
                                </v-btn>
                              </div>
                              <v-btn
                                color="primary"
                                variant="text"
                                @click="q.options.push('')"
                                class="mb-0 mt-2 px-0"
                                size="small"
                              >
                                <v-icon left>mdi-plus</v-icon>
                                Add Option
                              </v-btn>
                            </template>
                            <template v-else-if="q.type === 'RADIO-BUTTON'">
                              <div
                                v-for="(opt, optIdx) in q.options"
                                :key="optIdx"
                                class="d-flex"
                              >
                                <v-radio
                                  :model-value="false"
                                  density="comfortable"
                                  disabled
                                  hide-details
                                  class="mr-3 my-0 py-0"
                                  style="max-width: 20px"
                                  :class="q.options[optIdx] ? 'mb-0' : 'mb-5'"
                                />
                                <v-text-field
                                  v-model="q.options[optIdx]"
                                  placeholder="Enter option text"
                                  variant="flat"
                                  density="compact"
                                  rounded="lg"
                                  class="mr-2 pa-0"
                                  height="30"
                                  :rules="[(v) => !!v || 'Option is required']"
                                  style="flex-grow: 1"
                                  :hide-details="!!q.options[optIdx]"
                                />
                                <v-btn
                                  v-if="q.options.length > 1"
                                  icon
                                  size="small"
                                  @click="q.options.splice(optIdx, 1)"
                                  variant="text"
                                  :class="q.options[optIdx] ? 'mb-0' : 'mb-5'"
                                >
                                  <v-icon size="20">mdi-delete</v-icon>
                                </v-btn>
                              </div>
                              <v-btn
                                color="primary"
                                variant="text"
                                @click="q.options.push('')"
                                class="mb-0 mt-2 px-0"
                                size="small"
                              >
                                <v-icon left>mdi-plus</v-icon>
                                Add Option
                              </v-btn>
                            </template>
                            <template v-else-if="q.type === 'DROP-DOWN'">
                              <div class="mb-4">
                                <div
                                  class="text-caption text-grey-darken-1"
                                  style="font-size: 12px"
                                >
                                  Preview
                                </div>
                                <v-select
                                  :items="
                                    q.options.length
                                      ? q.options.filter((opt) => opt.trim())
                                      : ['Option 1', 'Option 2']
                                  "
                                  label="Select"
                                  variant="outlined"
                                  density="comfortable"
                                  rounded="lg"
                                  disabled
                                  hide-details
                                />
                              </div>
                              <div
                                v-for="(opt, optIdx) in q.options"
                                :key="optIdx"
                                class="d-flex align-center mb-2"
                              >
                                <div
                                  style="font-size: 14px"
                                  class="text-grey-darken-2"
                                  :class="q.options[optIdx] ? 'mb-0' : 'mb-5'"
                                >
                                  {{ `(${optIdx + 1})` }}
                                </div>
                                <div style="width: 100%" class="mr-2">
                                  <v-text-field
                                    v-model="q.options[optIdx]"
                                    placeholder="Enter option text"
                                    variant="flat"
                                    density="compact"
                                    rounded="lg"
                                    :rules="[
                                      (v) => !!v || 'Option is required',
                                    ]"
                                    :hide-details="!!q.options[optIdx]"
                                  />
                                </div>
                                <v-btn
                                  v-if="q.options.length > 1"
                                  icon
                                  size="small"
                                  @click="q.options.splice(optIdx, 1)"
                                  variant="text"
                                  :class="q.options[optIdx] ? 'mb-0' : 'mb-5'"
                                >
                                  <v-icon size="20">mdi-delete</v-icon>
                                </v-btn>
                              </div>
                              <v-btn
                                color="primary"
                                variant="text"
                                @click="q.options.push('')"
                                class="mb-0 mt-2 px-0"
                                size="small"
                              >
                                <v-icon left>mdi-plus</v-icon>
                                Add Option
                              </v-btn>
                            </template>
                            <template v-else-if="q.type === 'DATE'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Select Date
                              </div>
                              <v-text-field
                                label="Click to show calendar"
                                prepend-inner-icon="mdi-calendar"
                                density="comfortable"
                                variant="outlined"
                                rounded="lg"
                                disabled
                                hide-details
                              />
                            </template>
                            <template v-else-if="q.type === 'TIME'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Select Time
                              </div>
                              <v-text-field
                                label="Click to show time"
                                prepend-inner-icon="mdi-clock"
                                density="comfortable"
                                variant="outlined"
                                rounded="lg"
                                disabled
                                hide-details
                              />
                            </template>
                            <template v-else-if="q.type === 'DATE-TIME'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Select Date & Time
                              </div>
                              <v-text-field
                                label="Click to show date time"
                                prepend-inner-icon="mdi-calendar-clock"
                                density="comfortable"
                                variant="outlined"
                                rounded="lg"
                                disabled
                                hide-details
                              />
                            </template>
                            <template v-else-if="q.type === 'ATTACHMENT'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Upload File
                              </div>
                              <v-file-input
                                label="Upload file (Max size 5mb)"
                                density="comfortable"
                                variant="outlined"
                                rounded="lg"
                                disabled
                                hide-details
                              />
                            </template>
                          </div>
                        </v-card-text>
                        <v-card-actions class="px-4 pb-0 pt-0">
                          <v-spacer></v-spacer>
                          <v-btn
                            icon
                            @click="removeQuestion(idx)"
                            v-if="newStage.questionnaires.length > 1"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                          <v-switch
                            v-model="q.is_required"
                            hide-details
                            label="Required"
                            dense
                            color="primary"
                          />
                        </v-card-actions>
                      </v-card>
                      <v-btn
                        color="primary"
                        variant="text"
                        class="px-0"
                        @click="addQuestion"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Add Question
                      </v-btn>
                    </div>
                    <div v-else-if="newStage.type === 'DETAIL_FULFILLMENT'">
                      <v-card
                        elevation="0"
                        rounded="xl"
                        style="border: 1px solid #e0e0e0"
                        class="pa-4"
                      >
                        <div
                          v-for="(item, idx) in dataFulfillmentState"
                          :key="item.name"
                          class="mb-2"
                        >
                          <v-checkbox
                            v-model="item.state"
                            :label="item.label"
                            :true-value="1"
                            :false-value="0"
                            density="comfortable"
                            hide-details
                          />
                          <div v-if="item.state == 1" class="ml-8 mb-2">
                            <div
                              class="text-caption text-grey-darken-1"
                              style="font-size: 12px"
                            >
                              Description (Optional)
                            </div>
                            <v-text-field
                              v-model="item.notes"
                              placeholder="What will candidates do in this stage?"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              style="white-space: pre-wrap"
                            />
                          </div>
                        </div>
                      </v-card>
                    </div>
                    <div v-else-if="newStage.type === 'TEST_PSYCHO'">
                      <v-card
                        v-for="(t, idx) in newStage.attributes"
                        :key="idx"
                        elevation="0"
                        rounded="xl"
                        style="border: 1px solid #e0e0e0"
                        class="mb-4"
                      >
                        <v-card-text class="pb-0">
                          <div
                            class="text-caption text-grey-darken-1"
                            style="font-size: 12px"
                          >
                            Input Type
                          </div>
                          <v-select
                            v-model="t.test_type"
                            :items="[
                              {
                                text: 'File Submission',
                                value: 'FILE',
                              },
                              {
                                text: 'External Link',
                                value: 'LINK',
                              },
                            ]"
                            density="comfortable"
                            variant="outlined"
                            rounded="lg"
                            item-title="text"
                            item-value="value"
                            class="mb-4"
                            hide-details
                          />
                          <div
                            class="text-caption text-grey-darken-1"
                            style="font-size: 12px"
                          >
                            Test Name
                          </div>
                          <v-text-field
                            v-model="t.test_name"
                            placeholder="Enter test name"
                            density="comfortable"
                            variant="outlined"
                            rounded="lg"
                            :rules="[(v) => !!v || 'Test name is required']"
                          />
                          <div
                            class="text-caption text-grey-darken-1"
                            style="font-size: 12px"
                          >
                            Test Description (Optional)
                          </div>
                          <v-textarea
                            v-model="t.test_description"
                            placeholder="Enter test description"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :rows="2"
                          />

                          <div class="mb-4">
                            <template v-if="t.test_type === 'LINK'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Test Link Url
                              </div>
                              <v-text-field
                                v-model="t.test_url"
                                placeholder="https://example.com/test"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                :rules="[
                                  (v) => !!v || 'Test link url is required',
                                  (v) => {
                                    if (!v) return true;
                                    const lowerV = v.toLowerCase();
                                    return (
                                      (lowerV.includes('http') &&
                                        lowerV.includes('://') &&
                                        lowerV.includes('.')) ||
                                      'Please enter a valid URL'
                                    );
                                  },
                                ]"
                              />
                            </template>
                            <template v-else-if="t.test_type === 'FILE'">
                              <div
                                class="text-caption text-grey-darken-1"
                                style="font-size: 12px"
                              >
                                Upload File
                              </div>
                              <v-file-upload
                                density="comfortable"
                                variant="outlined"
                                v-model="t.test_file_employer"
                                placeholder="upload file (max size 5mb)"
                                rounded="lg"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                                category="test_doc"
                                :rules="[(v) => !!v || 'Test file is required']"
                              />
                            </template>
                          </div>
                        </v-card-text>
                        <v-card-actions
                          class="px-4 pb-0 pt-0"
                          v-if="newStage.attributes.length > 1"
                        >
                          <v-spacer></v-spacer>
                          <v-btn icon @click="removeTest(idx)">
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                      <v-btn
                        color="primary"
                        variant="text"
                        class="px-0"
                        @click="addTest"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Add Test
                      </v-btn>
                    </div>
                  </v-card-text>
                  <v-divider></v-divider>

                  <v-card-actions class="px-4 pb-4">
                    <v-spacer></v-spacer>
                    <v-btn
                      color="grey-darken-1"
                      @click="cancelStageDialog()"
                      variant="outlined"
                      rounded="lg"
                      height="48"
                    >
                      Cancel
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="elevated"
                      @click="saveNewStage"
                      rounded="lg"
                      height="48"
                      width="100"
                      :loading="saveStageLoading"
                    >
                      Save
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-form>
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
                :order="isMobile ? 3 : 2"
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
                :lg="route.query.c ? 6 : 4"
                :md="route.query.c ? 6 : 4"
                class="pa-1 py-2"
                v-if="isDesktop"
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
                cols="6"
                md="2"
                lg="2"
                class="px-1 py-2"
                :order="isMobile ? 2 : 5"
              >
                <v-btn
                  color="primary"
                  variant="elevated"
                  @click="handleNext"
                  :loading="nextStageLoading"
                  block
                  rounded="lg"
                  height="42"
                >
                  Next
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="viewDialog" scrollable max-width="600px">
      <v-card elevation="0" rounded="xl" style="border: 1px solid #e0e0e0">
        <v-toolbar density="compact" class="bg-transparent">
          <v-toolbar-title class="text-title"> Preview </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="viewDialog = false" variant="text"
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
            {{ selectedJob.company?.brand_name }}. Please provide or update the
            required information in your profile to proceed to the next stage of
            recruitment.
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
                  <span class="text-red">{{ q.is_required ? "*" : "" }}</span>
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
                      style="white-space: pre-wrap !important; resize: vertical"
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
                        q.options.length ? q.options : ['Option 1', 'Option 2']
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
          <div v-else-if="newStage.type === 'DETAIL_FULFILLMENT'" class="mt-4">
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
                <v-btn color="primary" variant="outlined" size="small" disabled>
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
                    <h4 class="font-weight-bold mb-2" style="color: #424242">
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
                        Please confirm if you have filled the test document and
                        fill out the name you put in the submission.
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
                          >Yes, the test document has been submitted.</span
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

import draggable from "vuedraggable";
import { ref } from "vue";
const { $apiFetch } = useApi();
const { isMobile, isTablet, isDesktop } = useScreenSize();

const stages = ref([]);
const stagesAll = ref([]);
const stageLoading = ref(false);
const fetchStages = async () => {
  if (!route.params.id) {
    console.error("Job ID is missing");
    stageLoading.value = false;
    return;
  }
  
  stageLoading.value = true;
  try {
    const response = await $apiFetch("/job-steps/search", {
      method: "GET",
      params: {
        filters: {
          job_id: route.params.id,
        },
        expands: "questionnaires",
        limit: 100,
        sortBy: { step_order: "asc" },
      },
    });
    
    if (response && response.items) {
      stages.value = response.items.filter(
        (i) => i.type != "SYS_SHORTLIST" && i.type != "SYS_HIRED"
      );
      stagesAll.value = response.items;
    } else {
      stages.value = [];
      stagesAll.value = [];
    }
  } catch (error) {
    console.error("Error fetching stages:", error);
    stages.value = [];
    stagesAll.value = [];
  } finally {
    stageLoading.value = false;
  }
};

const stageOptions = [
  { type: "DETAIL_FULFILLMENT", name: "Detail Fulfillment" },
  { type: "TEST_PSYCHO", name: "Test Submission" },
  { type: "QUESTIONNAIRE", name: "Questionnaire" },
  { type: "INTERVIEW", name: "Interview" },
];

const addStageMenu = ref(false);
const stageDialog = ref(false);
const stageForm = ref(null);
const isFormValid = ref(false);
const newStage = ref({
  type: null,
  step_name: null,
  description: null,
  questionnaires: [],
});

function addStage() {
  stages.value.push({ id: Date.now(), type: "Interview", name: "New Stage" });
}

const snackbar = useSnackbarStore();

const dialog = useDialogStore();
const removeStageId = ref([]);
const removeStage = async (index) => {
  await dialog.openDialog({
    title: "Delete Stage",
    message: "Are you sure you want to delete this stage?",
    confirmButtonText: "Delete",
    confirmButtonColor: "error",
    autoClose: false,
  });
  dialog.loading = true;
  if (stages.value[index].id) {
    removeStageId.value.push(stages.value[index].id);
  }
  stages.value.splice(index, 1);
  dialog.closeDialog();
};

const editStage = (index) => {
  stages.value[index].questionnaires = stages.value[index].questionnaires.sort(
    (a, b) => a.no - b.no
  );
  newStage.value = stages.value[index];
  if (newStage.value.type === "DETAIL_FULFILLMENT") {
    dataFulfillmentState.value = dataFulfillmentState.value.map((i) => ({
      ...i,
      state: parseInt(
        newStage.value.attributes.find((j) => j.name === i.name)?.state
      ),
      notes: newStage.value.attributes.find((j) => j.name === i.name)?.notes,
    }));
  }
  stageDialog.value = true;
  // open dialog/modal to edit
};

const viewStage = (index) => {
  viewDialog.value = true;
  newStage.value = stages.value[index];
};

const viewDialog = ref(false);

const cancelStageDialog = async () => {
  await dialog.openDialog({
    title: "Cancel",
    message:
      "Are you sure you want to cancel from this stage? Any changes made will not be saved.",
    confirmButtonText: "Yes, Confirm",
    confirmButtonColor: "primary",
    autoClose: false,
  });
  stageDialog.value = false;
  dialog.closeDialog();
};

const exStagePlaceholder = (type) => {
  switch (type) {
    case "QUESTIONNAIRE":
      return "ex: Screening Questions";
    case "DETAIL_FULFILLMENT":
      return "ex: Certificate Needed";
    case "INTERVIEW":
      return "ex: User Interview";
    case "TEST_PSYCHO":
      return "ex: Psychology Test";
    default:
      return "ex: Screening Questions";
  }
};

const loadingAsDraft = ref(false);
async function saveCurrentStatus() {
  loadingAsDraft.value = true;

  nextStageLoading.value = true;
  stages.value = stages.value.map((stage, index) => ({
    ...stage,
    step_order: index + 1,
  }));
  try {
    for (let i = 0; i < stages.value.length; i++) {
      $apiFetch(`/job-steps/${stages.value[i].id}`, {
        method: "PATCH",
        body: {
          step_order: stages.value[i].step_order,
        },
      });
    }
    for (let i = 0; i < removeStageId.value.length; i++) {
      await $apiFetch("/job-steps/" + removeStageId.value[i], {
        method: "DELETE",
      });
    }

    await $apiFetch("/jobs/" + route.params.id, {
      method: "PATCH",
      body: {
        status: selectedJob.value.status,
      },
    });
    router.replace("/admin/jobs/employer?id=" + route.params.id);
  } catch (error) {
    console.error("Error saving stages:", error);
  } finally {
    loadingAsDraft.value = false;
  }
}

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

const handleBack = () => {
  router.replace({
    path: "/admin/jobs/employer/form/" + route.params.id + "/1",
    query: route.query,
  });
};

const nextStageLoading = ref(false);
const handleNext = async () => {
  nextStageLoading.value = true;
  stages.value = stages.value.map((stage, index) => ({
    ...stage,
    step_order: index + 1,
  }));
  try {
    const stagesData = [];
    for (let i = 0; i < stages.value.length; i++) {
      await $apiFetch(`/job-steps/${stages.value[i].id}`, {
        method: "PATCH",
        body: {
          step_order: stages.value[i].step_order,
        },
      });
    }
    for (let i = 0; i < removeStageId.value.length; i++) {
      await $apiFetch("/job-steps/" + removeStageId.value[i], {
        method: "DELETE",
      });
    }
    router.replace({
      path: "/admin/jobs/employer/form/" + route.params.id + "/3",
      query: route.query,
    });
  } catch (error) {
    console.error("Error saving stages:", error);
  } finally {
    nextStageLoading.value = false;
  }
};

const selectStage = (option) => {
  newStage.value = {
    type: option.type,
    step_name: "",
    description: "",
  };
  stageDialog.value = true;
  if (option.type === "DETAIL_FULFILLMENT") {
    dataFulfillmentState.value = dataFulfillmentState.value.map((i) => ({
      ...i,
      state: 0,
      notes: null,
    }));
  }
  if (option.type === "QUESTIONNAIRE") {
    newStage.value.questionnaires = [];
    addQuestion();
  }
  if (option.type === "TEST_PSYCHO") {
    newStage.value.attributes = [];
    addTest();
  }
};

const dataFulfillmentState = ref([]);
const fetchDataFulfillment = async () => {
  const response = await $apiFetch("/configs/key/list_of_wizard_candidate");
  dataFulfillmentState.value = response.value.map((item) => ({
    id: item.id,
    name: item.name,
    label: item.label,
    state: 0,
    notes: null,
  }));
};

const saveStageLoading = ref(false);
const saveNewStage = async () => {
  const validation = await stageForm.value.validate();
  if (validation.valid) {
    let stageData = {
      job_id: route.params.id,
      attributes: null,
      status: "PENDING",
      type: newStage.value.type,
      step_name: newStage.value.step_name,
      step_order: newStage.value.id
        ? newStage.value.step_order
        : stages.value.length + 1,
      description: newStage.value.description,
      attributes: newStage.value.attributes,
    };
    if (newStage.value.id) {
      stageData.id = newStage.value.id;
    }
    if (newStage.value.type === "DETAIL_FULFILLMENT") {
      stageData.attributes = JSON.parse(
        JSON.stringify(dataFulfillmentState.value)
      );
    }

    try {
      saveStageLoading.value = true;
      let res;
      if (newStage.value.id) {
        res = await $apiFetch("/job-steps/" + newStage.value.id, {
          method: "PATCH",
          body: stageData,
        });
      } else {
        res = await $apiFetch("/job-steps", {
          method: "POST",
          body: stageData,
        });
      }

      if (res.id && newStage.value.type === "QUESTIONNAIRE") {
        await Promise.all(
          newStage.value.questionnaires.map(async (q, idx) => {
            q.job_step_id = res.id;
            q.no = idx + 1;
            if (q.id) {
              await $apiFetch("/questionnaires/" + q.id, {
                method: "PATCH",
                body: q,
              });
            } else {
              await $apiFetch("/questionnaires", {
                method: "POST",
                body: q,
              });
            }
          })
        );
        for (let i = 0; i < removeQuestionIds.value.length; i++) {
          await $apiFetch("/questionnaires/" + removeQuestionIds.value[i], {
            method: "DELETE",
          });
        }
      }

      stageDialog.value = false;
      newStage.value = {
        type: null,
        step_name: null,
        description: null,
        questionnaires: [],
      };
      dataFulfillmentState.value.forEach((i) => {
        i.checked = false;
        i.description = "";
      });
      fetchStages();
    } catch (error) {
      console.log(error);
    } finally {
      saveStageLoading.value = false;
    }
  }
};

const removeQuestionIds = ref([]);
const removeQuestion = (index) => {
  if (newStage.value.questionnaires[index].id) {
    removeQuestionIds.value.push(newStage.value.questionnaires[index].id);
  }
  newStage.value.questionnaires.splice(index, 1);
};

function addQuestion() {
  newStage.value.questionnaires.push({
    question: "",
    type: "TEXT",
    is_required: true,
    options: [],
  });
}

const removeTest = (index) => {
  if (newStage.value.attributes[index].id) {
    removeTestIds.value.push(newStage.value.attributes[index].id);
  }
  newStage.value.attributes.splice(index, 1);
};

const addTest = () => {
  newStage.value.attributes = newStage.value.attributes || [];
  newStage.value.attributes.push({
    test_type: "FILE",
    test_name: "",
    test_description: "",
    test_file_employer: null,
    test_url: null,
  });
};

// Add this new function to handle question type changes
const handleQuestionTypeChange = (question, newType) => {
  question.type = newType;

  // Initialize options for types that need them
  if (["CHECKBOX", "RADIO-BUTTON", "DROP-DOWN"].includes(newType)) {
    if (!question.options || question.options.length === 0) {
      question.options = [""];
    }
  } else {
    // Clear options for types that don't need them
    question.options = [];
  }
};

const selectedJob = useState("selectedJob", () => ({ status: "DRAFT" }));
const fetchJob = async () => {
  if (!route.params.id) {
    console.error("Job ID is missing");
    return;
  }
  
  try {
    const response = await $apiFetch("/jobs/search", {
      params: {
        filters: {
          id: route.params.id,
        },
        limit: 1,
      },
    });
    
    if (response && response.items && response.items.length > 0) {
      Object.assign(selectedJob.value, response.items[0]);
    }
  } catch (error) {
    console.error("Error fetching job:", error);
  }
};

onMounted(async () => {
  if (!selectedJob.value.id) {
    await fetchJob();
  }
  fetchStages();
  fetchDataFulfillment();
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
