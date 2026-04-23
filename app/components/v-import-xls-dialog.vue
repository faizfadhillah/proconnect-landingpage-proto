<template>
  <v-dialog v-model="attributes.dialog" max-width="500" persistent>
    <v-card
      rounded="xl"
      prepend-icon="mdi-file-upload"
      :title="`Import Data From Excel?`"
    >
      <v-card-text>
        <p class="text-caption mb-2">
          Please download the provided Excel template first before uploading
          your file. Simply click the
          <v-btn @click="$emit('export-data')" size="x-small" color="green"
            >Template Xls.</v-btn
          >
          fill the template, and save your file before proceeding with the
          upload.
        </p>
        <div
          v-if="!attributes.file"
          class="drag-drop-area"
          @dragover.prevent="attributes.isDragging = true"
          @dragleave="attributes.isDragging = false"
          @drop.prevent="handleDrop"
          :class="{ dragging: attributes.isDragging }"
        >
          <v-icon
            size="48"
            color="primary"
            @click="
              $refs.fileInput.$el.querySelector('input[type=\'file\']').click()
            "
            >mdi-file-upload</v-icon
          >
          <p class="text-caption">
            Drag and drop your Excel file here or
            <span
              class="upload-link"
              @click="
                $refs.fileInput.$el
                  .querySelector('input[type=\'file\']')
                  .click()
              "
            >
              click to upload.</span
            >
          </p>
        </div>
        <div v-else class="file-info text-center">
          <v-icon size="70" color="success">mdi-microsoft-excel</v-icon>
          <p class="text-caption">
            File
            <strong>{{ attributes.file.name }}</strong> selected successfully!
            <span class="upload-link" @click="attributes.file = null">
              Change file </span
            >.
          </p>
        </div>
        <v-file-input
          ref="fileInput"
          class="hidden"
          v-model="attributes.file"
          accept=".xls,.xlsx"
          @change="handleFileSelect"
        />
      </v-card-text>
      <template v-slot:actions>
        <v-spacer></v-spacer>

        <v-btn @click="attributes.dialog = false"> cancel </v-btn>

        <v-btn
          @click="$emit('import-data', attributes.file)"
          :loading="attributes.loading"
          variant="elevated"
          color="primary"
          rounded="xl"
          :disabled="!attributes.file"
        >
          Upload & Process
        </v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref } from "vue";
export default {
  name: "VImportXlsDialog",
  props: {
    loading: {
      type: Boolean,
      required: false,
    },
  },
  setup() {
    const attributes = ref({
      dialog: false,
      file: null,
      isDragging: false,
      loading: false,
    });

    const handleDrop = (event) => {
      attributes.value.isDragging = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (validateFileType(file)) {
          attributes.value.file = file;
        } else {
          alert("Only Excel files (.xls, .xlsx) are allowed.");
        }
      }
    };

    const handleFileSelect = () => {
      const file = attributes.value.file;
      if (file && !validateFileType(file)) {
        alert("Only Excel files (.xls, .xlsx) are allowed.");
        attributes.value.file = null;
      }
    };

    const validateFileType = (file) => {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      return validTypes.includes(file.type);
    };

    return {
      attributes,
      handleDrop,
      handleFileSelect,
      validateFileType,
    };
  },
};
</script>

<style>
.drag-drop-area {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  border-radius: 10px;
}
.dragging {
  border-color: #1976d2;
}
.hidden {
  display: none !important;
}
.upload-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}
</style>
