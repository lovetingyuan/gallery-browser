<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useFileSystem } from "@/composables/useFileSystem";
import TopBar from "@/components/TopBar.vue";
import FolderTree from "@/components/FolderTree.vue";
import MediaGrid from "@/components/MediaGrid.vue";

const savedGridSize = localStorage.getItem("gallery-grid-size");
const gridSize = ref(savedGridSize ? Number(savedGridSize) : 200);

const savedSidebarState = localStorage.getItem("gallery-sidebar-open");
const isSidebarOpen = ref(savedSidebarState ? savedSidebarState === "true" : true);

watch(gridSize, (newVal) => {
  localStorage.setItem("gallery-grid-size", newVal.toString());
});

watch(isSidebarOpen, (newVal) => {
  localStorage.setItem("gallery-sidebar-open", newVal.toString());
});

const {
  isScanning,
  error,
  rootNode,
  searchQuery,
  selectedDirectoryPath,
  selectedExtensions,
  sortBy,
  availableExtensions,
  filteredFiles,
  openDirectory,
  selectDirectory,
} = useFileSystem();
</script>

<template>
  <div class="h-screen w-full flex flex-col overflow-hidden bg-base-100">
    <TopBar
      :is-scanning="isScanning"
      :search-query="searchQuery"
      :available-extensions="availableExtensions"
      :selected-extensions="selectedExtensions"
      :grid-size="gridSize"
      :sort-by="sortBy"
      :is-sidebar-open="isSidebarOpen"
      @update:search-query="searchQuery = $event"
      @update:selected-extensions="selectedExtensions = $event"
      @update:grid-size="gridSize = $event"
      @update:sort-by="sortBy = $event"
      @open-directory="openDirectory"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
    />

    <div class="flex-1 flex overflow-hidden relative">
      <aside
        class="bg-base-100 flex-shrink-0 transition-all duration-300 overflow-hidden"
        :class="isSidebarOpen ? 'w-64 md:w-80 border-r border-base-200' : 'w-0 border-r-0'"
      >
        <div class="w-64 md:w-80 h-full overflow-y-auto custom-scrollbar p-2">
          <ul v-if="rootNode && !isScanning" class="menu bg-base-100 w-full rounded-box">
            <FolderTree
              :node="rootNode"
              :selected-path="selectedDirectoryPath"
              @select="selectDirectory"
            />
          </ul>

          <div v-else-if="!isScanning" class="p-4 text-center text-base-content/50 mt-10">
            <Icon icon="heroicons-outline:folder" class="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p class="text-sm">Click "Select Folder" to choose a local folder.</p>
          </div>

          <div
            v-if="isScanning"
            class="flex flex-col items-center justify-center p-8 space-y-4 mt-10"
          >
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm font-medium">Scanning folders...</p>
          </div>
        </div>
      </aside>

      <main class="flex-1 bg-base-200/50 overflow-hidden relative">
        <MediaGrid :files="filteredFiles" :grid-size="gridSize" />
      </main>

      <div v-if="error" class="toast toast-bottom toast-end z-50">
        <div class="alert alert-error">
          <Icon icon="heroicons-outline:x-circle" class="stroke-current shrink-0 h-6 w-6" />
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}
</style>
