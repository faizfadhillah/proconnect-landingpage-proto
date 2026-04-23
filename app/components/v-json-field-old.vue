<template>
  <v-container class="pa-0">
    <v-expansion-panels variant="accordion v-json-field">
      <v-expansion-panel :title="label + ` (${type})`">
        <v-expansion-panel-text class="px-0">
          <v-card-text class="pa-1 px-0">
            <v-row>
              <v-col cols="12">
                <!-- Editable Tree View -->
                <v-treeview
                  :items="tree"
                  open-all
                  dense
                  activatable
                  item-value="id"
                  item-text="name"
                  item-children="children"
                  class="pa-0 ma-0"
                >
                  <template v-slot:prepend="{ item }">
                    <div
                      v-if="
                        item.type === 'image' || item.name.includes('image')
                      "
                      class="d-flex align-center"
                    >
                      <span>{{ item.name }} : </span>
                      <v-img
                        :src="item.value"
                        max-height="100"
                        max-width="100"
                        class="mr-2"
                      />
                      <v-btn
                        color="brown"
                        size="x-small"
                        @click="triggerFileUpload(item.id)"
                        >Change Image</v-btn
                      >
                      <input
                        type="file"
                        accept="image/*"
                        ref="fileInputs"
                        :id="`file-${item.id}`"
                        class="d-none"
                        @change="handleImageUpload($event, item.id)"
                      />
                    </div>
                    <div
                      v-else-if="item.type === 'string'"
                      class="d-flex align-center"
                    >
                      <v-textarea
                        v-model="item.value"
                        :label="`${item.name} : `"
                        rows="1"
                        dense
                        outlined
                        density="compact"
                        hide-details
                        style="min-width: 250px"
                      ></v-textarea>
                    </div>
                    <div
                      v-else-if="item.type === 'number'"
                      class="d-flex align-center"
                    >
                      <v-text-field
                        type="number"
                        v-model="item.value"
                        :label="`${item.name} : `"
                        rows="1"
                        dense
                        outlined
                        density="compact"
                        hide-details
                        style="min-width: 400px"
                      ></v-text-field>
                    </div>

                    <div v-else>
                      {{ item.name + " : " }}&nbsp; ({{ item.type }})
                    </div>
                  </template>
                  <template v-slot:append="{ item }">
                    <div style="width: 0px"></div>
                  </template>
                </v-treeview>

                <!-- Add New Item Form -->
                <v-divider class="my-4"></v-divider>

                <v-row class="px-4">
                  <v-col cols="12" class="py-1 px-3 text-caption">
                    Add New Item ?
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    class="py-0"
                    v-if="type == 'object' && modelValue"
                  >
                    <v-text-field
                      v-model="newItem.name"
                      label="Key"
                      density="compact"
                      outlined
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" sm="6" class="py-0">
                    <v-select
                      v-model="newItem.type"
                      :items="
                        modelValue
                          ? ['string', 'number', 'image', 'object', 'array']
                          : ['array', 'object']
                      "
                      label="Type"
                      density="compact"
                      outlined
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="addNewItem"
                      :disabled="!newItem.type"
                    >
                      Add New Item
                    </v-btn>
                  </v-col>
                </v-row>
                <v-divider class="my-4"></v-divider>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="py-0 px-4">
            <v-btn
              size="small"
              color="success"
              variant="elevated"
              @click="emitUpdatedJson"
              :loading="submitLoading"
              >Update JSON</v-btn
            >
          </v-card-actions>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-card> </v-card>
  </v-container>
</template>

<script>
export default {
  name: "VJsonField",
  props: {
    label: {
      type: String,
      default: "Attributs",
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      type: "",
      tree: [],
      submitLoading: false,
      selectedNode: null, // Node yang dipilih untuk penambahan
      flatTree: [],
      newItem: {
        name: "",
        type: "", // Default type
      },
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newValue) {
        // Update tree whenever modelValue changes
        this.tree = this.generateTreeFromJson(newValue);
        if (Array.isArray(newValue)) {
          this.type = "array";
        }
      },
    },
    tree: {
      immediate: true,
      handler(newTree) {
        this.flatTree = this.flattenTree(newTree);
      },
    },
  },
  methods: {
    generateTreeFromJson(obj, parentId = null, path = "") {
      const tree = [];
      Object.keys(obj).forEach((key, index) => {
        const id = `${parentId !== null ? `${parentId}-` : ""}${index}`;
        const newPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (typeof value === "object" && !Array.isArray(value)) {
          tree.push({
            id,
            name: key,
            type: "object",
            path: newPath,
            children: this.generateTreeFromJson(value, id, newPath),
          });
        } else if (Array.isArray(value)) {
          tree.push({
            id,
            name: key,
            type: "array",
            path: newPath,
            children: value.map((item, i) => ({
              id: `${id}-${i}`,
              name: `[${i}]`,
              value: item,
              type: typeof item === "string" ? "string" : "unknown",
              path: `${newPath}[${i}]`,
            })),
          });
        } else if (typeof value === "string" && this.isImageUrl(value)) {
          tree.push({
            id,
            name: key,
            value,
            type: "image",
            path: newPath,
          });
        } else {
          tree.push({
            id,
            name: key,
            value,
            type: typeof value,
            path: newPath,
          });
        }
      });
      return tree;
    },
    isImageUrl(url) {
      return /\.(jpeg|jpg|gif|png|webp)$/.test(url);
    },
    triggerFileUpload(id) {
      const input = document.getElementById(`file-${id}`);
      if (input) {
        input.click();
      }
    },
    handleImageUpload(event, id) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const treeItem = this.findTreeItemById(this.tree, id);
          if (treeItem) {
            treeItem.value = e.target.result; // Update image value with base64
          }
        };
        reader.readAsDataURL(file);
      }
    },
    findTreeItemById(tree, id) {
      for (const item of tree) {
        if (item.id === id) return item;
        if (item.children) {
          const found = this.findTreeItemById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    emitUpdatedJson() {
      this.submitLoading = true;
      const updatedJson = this.convertTreeToJson(this.tree);
      this.$emit("update:modelValue", updatedJson); // Emit updated JSON back to parent
      setTimeout(() => {
        this.submitLoading = false;
        console.log(updatedJson);
      }, 500);
    },
    convertTreeToJson(tree) {
      const obj = {};
      tree.forEach((item) => {
        if (item.type === "object") {
          obj[item.name] = this.convertTreeToJson(item.children);
        } else if (item.type === "array") {
          obj[item.name] = item.children.map((child) => child.value);
        } else {
          obj[item.name] = item.value;
        }
      });
      return obj;
    },
    addNewItem() {
      const { name, type } = this.newItem;

      if (!this.modelValue) {
        this.type = type;
        switch (type) {
          case "object":
            this.$emit("update:modelValue", {});
            break;
          case "array":
            this.$emit("update:modelValue", []);
            break;
        }
        this.newItem.type = null;
        return;
      }

      let newValue;
      if (type === "string") {
        newValue = "";
      } else if (type === "number") {
        newValue = 0;
      } else if (type === "image") {
        newValue = ""; // Initially empty; user can upload later
      } else if (type === "object") {
        newValue = {};
      } else if (type === "array") {
        newValue = [];
      }

      this.tree.push({
        id: `${this.tree.length}`,
        name,
        type,
        value: newValue,
        children: type === "object" || type === "array" ? [] : undefined,
      });

      // Clear form
      this.newItem.name = "";
      this.newItem.type = "string";
    },
  },
};
</script>

<style scoped>
/* Tambahkan styling sesuai kebutuhan */
</style>
