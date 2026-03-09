<script setup lang="ts">
import { computed } from "vue";
import type { MediaFile } from "@/types/file-system";
import MediaCard from "./MediaCard.vue";

const props = defineProps<{
  files: MediaFile[];
}>();

// Simple pagination to avoid rendering 10,000 DOM elements at once
// even if we have lazy loading, too many elements kill the browser
import { ref } from "vue";

const displayLimit = ref(50);

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  const { scrollTop, clientHeight, scrollHeight } = target;

  // If close to bottom (within 200px)
  if (scrollHeight - scrollTop - clientHeight < 200) {
    if (displayLimit.value < props.files.length) {
      displayLimit.value += 50;
    }
  }
};

const displayedFiles = computed(() => {
  return props.files.slice(0, displayLimit.value);
});

// Watch for file changes to reset limit
import { watch } from "vue";
watch(
  () => props.files,
  () => {
    displayLimit.value = 50;
  },
);
</script>

<template>
  <div class="h-full overflow-y-auto p-4 custom-scrollbar" @scroll="handleScroll">
    <div
      v-if="files.length === 0"
      class="flex flex-col items-center justify-center h-full text-base-content/50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-16 w-16 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <p class="text-lg font-medium">No media files found</p>
      <p class="text-sm">Select a directory or adjust your search.</p>
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <MediaCard v-for="file in displayedFiles" :key="file.id" :file="file" />
    </div>

    <!-- Loading more indicator -->
    <div v-if="displayLimit < files.length" class="flex justify-center p-4">
      <span class="loading loading-spinner text-primary"></span>
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
