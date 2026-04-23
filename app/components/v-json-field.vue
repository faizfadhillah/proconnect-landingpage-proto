<template>
  <v-container class="pa-0">
    <v-expansion-panels variant="accordion" class="v-json-field">
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ label + ` : (${type})` }}
          <v-spacer />
        </v-expansion-panel-title>
        <v-expansion-panel-text class="px-0">
          <v-card-text style="overflow-x: auto" class="pa-0">
            <v-row>
              <v-col cols="12" class="px-0">
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
                  v-model="selectedNode"
                >
                  <template v-slot:prepend="{ item }">
                    <div
                      v-if="
                        item.type === 'image' ||
                        item.name.includes('image') ||
                        item.name.includes('_url')
                      "
                      class="d-flex align-center pl-3"
                    >
                      <span>{{ item.name || item.id }} : </span>
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
                      v-else-if="item.type === 'number'"
                      class="d-flex align-center pl-3"
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
                      ></v-text-field>
                    </div>
                    <div
                      v-else-if="
                        item.type === 'string' || item.type === 'unknown'
                      "
                      class="d-flex align-center pl-3"
                    >
                      <v-textarea
                        v-model="item.value"
                        :label="`${item.name} : `"
                        rows="1"
                        dense
                        outlined
                        density="compact"
                        hide-details
                        @keydown.space.native.prevent="handleSpace($event)"
                      ></v-textarea>
                    </div>

                    <div v-else>
                      {{ item.name + " : " }}&nbsp; ({{ item.type }})
                    </div>
                  </template>
                  <template v-slot:append="{ item }">
                    <div
                      v-if="
                        (item.name.includes('[') && item.name.includes(']')) ||
                        (!isNaN(Number(item.name)) && item.name.trim() !== '')
                      "
                    >
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="warning"
                        icon="mdi-content-duplicate"
                        density="compact"
                        @click="duplicateContent(item)"
                      ></v-btn>
                    </div>
                    <v-btn
                      v-if="checkIfExist(item)"
                      size="small"
                      variant="outlined"
                      color="error"
                      icon="mdi-delete"
                      density="compact"
                      class="ml-1"
                      @click="deleteContent(item)"
                    ></v-btn>
                  </template>
                </v-treeview>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="pa-0">
            <v-row>
              <v-col cols="12">
                <!-- Add New Item Form -->
                <v-divider class="my-3" />
                <v-row class="px-4">
                  <v-col cols="12" class="pb-1 px-4 text-caption">
                    {{
                      modelValue && typeof modelValue === "object"
                        ? "Add New"
                        : "Init Value"
                    }}
                  </v-col>
                  <v-col cols="12" v-if="flatTree.length">
                    <v-select
                      v-model="selectedNode"
                      :items="flatTree"
                      item-value="id"
                      item-title="name"
                      label="Target Node"
                      density="compact"
                      outlined
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col
                    cols="6"
                    sm="6"
                    class="py-0"
                    v-if="
                      (modelValue &&
                        !Array.isArray(modelValue) &&
                        !flatTree.length) ||
                      (flatTree.length &&
                        flatTree.find((x) => x.id == selectedNode) &&
                        flatTree.find((x) => x.id == selectedNode).type ==
                          'object') ||
                      (!selectedNode &&
                        modelValue &&
                        !Array.isArray(modelValue))
                    "
                  >
                    <v-text-field
                      v-model="newItem.name"
                      label="Key"
                      density="compact"
                      outlined
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" sm="6" class="py-0">
                    <v-select
                      v-model="newItem.type"
                      :items="
                        modelValue
                          ? ['string', 'image', 'object', 'array']
                          : ['object', 'array']
                      "
                      label="Type"
                      density="compact"
                      outlined
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      v-if="selectedNode"
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="addNewItems"
                      :disabled="!newItem.type"
                    >
                      Add New Item
                    </v-btn>
                    <v-btn
                      v-else-if="modelValue && typeof modelValue === 'object'"
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="addNewKey"
                      :disabled="!newItem.type"
                    >
                      Add Key
                    </v-btn>
                    <v-btn
                      v-else
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="initItem"
                      :disabled="!newItem.type"
                    >
                      Init Value
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
            <v-spacer />
            <v-btn @click="resetValue()" density="compact" color="error"
              ><v-icon>mdi-restart-alert</v-icon> reset
            </v-btn>
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
      type: [Object, String, Array],
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
        } else {
          this.type = "object";
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
  mounted() {
    this.tree = this.generateTreeFromJson(this.modelValue);
    if (Array.isArray(this.modelValue)) {
      this.type = "array";
    } else {
      this.type = "object";
    }
  },
  methods: {
    resetValue() {
      this.selectedNode = null;
      this.$emit("update:modelValue", "");
      this.tree = this.generateTreeFromJson(this.modelValue);
      if (Array.isArray(this.modelValue)) {
        this.type = "array";
      } else {
        this.type = "object";
      }
    },
    handleSpace(event) {
      event.target.value += " "; // Tambahkan spasi manual
      event.preventDefault(); // Mencegah default behavior
    },
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
      console.log("updatedJson", updatedJson);
      this.$emit("update:modelValue", updatedJson); // Emit updated JSON back to parent
      setTimeout(() => {
        this.submitLoading = false;
      }, 500);
    },
    convertTreeToJson(tree, type = null) {
      let obj = this.type == "object" ? {} : [];
      if (type == "object") {
        obj = {};
      }
      tree.forEach((item) => {
        if (item.type === "object") {
          obj[item.name] = this.convertTreeToJson(item.children, item.type);
        } else if (item.type === "array") {
          obj[item.name] = item.children.map((child) => child.value);
        } else {
          obj[item.name] = item.value;
        }
      });
      return obj;
    },

    initItem() {
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
      }
      this.emitUpdatedJson();
    },

    addNewKey() {
      const { name, type } = this.newItem;

      let newValue;
      if (type === "string") {
        newValue = "";
      } else if (type === "number") {
        newValue = 1;
      } else if (type === "image") {
        newValue = ""; // Initially empty; user can upload later
      } else if (type === "object") {
        newValue = {};
      } else if (type === "array") {
        newValue = [];
      }

      if (Array.isArray(this.modelValue) && !this.selectedNode) {
        this.modelValue.push(newValue);
      }

      this.tree.push({
        id: `${this.tree.length}`,
        name: name || `${this.tree.length}`,
        type,
        value: newValue,
        children: type === "object" || type === "array" ? [] : undefined,
      });

      console.log("tree", this.tree, this.modelValue);
      // Clear form
      this.newItem.name = "";
      this.newItem.type = null;
      if (type != "image") {
        this.emitUpdatedJson();
      }
    },

    flattenTree(tree, path = "") {
      let flat = [];
      tree.forEach((item) => {
        if (item.type == "object" || item.type == "array") {
          flat.push({
            id: item.id,
            name: path ? `${path} > ${item.name}` : item.name,
            type: item.type,
          });
        }
        if (item.children) {
          flat = flat.concat(this.flattenTree(item.children, item.name));
        }
      });
      return flat;
    },

    addNewItems() {
      const { name, type } = this.newItem;

      const targetNode = this.findTreeItemById(this.tree, this.selectedNode);

      if (!targetNode || !["object", "array"].includes(targetNode.type)) {
        alert("Please select a valid parent node.");
        return;
      }

      let newValue;
      if (type === "string") {
        newValue = "";
      } else if (type === "image") {
        newValue = ""; // Initially empty; user can upload later
      } else if (type === "object") {
        newValue = {};
      } else if (type === "array") {
        newValue = [];
      }

      const newChild = {
        id: `${targetNode.id}-${targetNode.children.length}`,
        name,
        type,
        value: newValue,
        children: ["object", "array"].includes(type) ? [] : undefined,
      };

      targetNode.children.push(newChild);

      // Refresh flattened tree and clear form
      this.flatTree = this.flattenTree(this.tree);
      this.newItem.name = "";
      this.newItem.type = "";
      if (type != "image") {
        this.emitUpdatedJson();
      }
    },

    duplicateContent(item) {
      this.emitUpdatedJson();
      setTimeout(() => {
        let parentPath = this.getParentPath(item.path);
        let data = this.getNestedValue(this.modelValue, parentPath);
        if (Array.isArray(data)) {
          if (item.name.includes("[")) {
            item.name.replace("[", "").replace("]", "");
          }
          data.push(data[item.name]);
        }
        this.tree = this.generateTreeFromJson(this.modelValue);
      }, 100);
    },

    deleteContent(item) {
      let parentPath = this.getParentPath(item.path);
      let data = this.getNestedValue(this.modelValue, parentPath);
      if (Array.isArray(data)) {
        if (item.name.includes("[")) {
          item.name = item.name.replace("[", "").replace("]", "");
        }
        data.splice(item.name, 1);
      } else {
        delete data[item.name || item.id];
      }
      this.tree = this.generateTreeFromJson(this.modelValue);
    },

    checkIfExist(item) {
      try {
        let parentPath = this.getParentPath(item.path);
        let data = this.getNestedValue(this.modelValue, parentPath);
        if (item.name && item.name.includes("[")) {
          item.name = item.name.replace("[", "").replace("]", "");
        }

        return data && data[item.name || item.id] !== undefined ? true : false;
      } catch (e) {
        return false;
      }
    },

    getParentPath(path) {
      // Check if the path contains an array index
      if (path.includes("[")) {
        // Remove the last array index
        return path.replace(/\[\d+\]$/, "");
      } else {
        // Remove the last dot-separated part
        return path.split(".").slice(0, -1).join(".");
      }
    },

    getNestedValue(data, path) {
      if (!path) {
        return data;
      }

      // Split the path into parts, considering dot and array indices
      const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");

      // Traverse the object using the keys
      return keys.reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
        data
      );
    },
  },
};
</script>

<style scoped>
/* Tambahkan styling sesuai kebutuhan */
</style>
