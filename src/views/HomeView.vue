<script setup lang="ts">
import { useFileSystem } from "@/composables/useFileSystem";
import TopBar from "@/components/TopBar.vue";
import FolderTree from "@/components/FolderTree.vue";
import MediaGrid from "@/components/MediaGrid.vue";

const {
  isScanning,
  error,
  rootNode,
  searchQuery,
  selectedDirectoryPath,
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
      @update:search-query="searchQuery = $event"
      @open-directory="openDirectory"
    />

    <div class="flex-1 flex overflow-hidden relative">
      <aside
        class="w-64 md:w-80 border-r border-base-200 overflow-y-auto bg-base-100 flex-shrink-0 custom-scrollbar"
      >
        <div class="p-2">
          <ul v-if="rootNode && !isScanning" class="menu bg-base-100 w-full rounded-box">
            <FolderTree
              :node="rootNode"
              :selected-path="selectedDirectoryPath"
              @select="selectDirectory"
            />
          </ul>

          <div v-else-if="!isScanning" class="p-4 text-center text-base-content/50 mt-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
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
        <MediaGrid :files="filteredFiles" />
      </main>

      <div v-if="error" class="toast toast-bottom toast-end z-50">
        <div class="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
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
