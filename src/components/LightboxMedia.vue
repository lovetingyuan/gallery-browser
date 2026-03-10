<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { MediaFile } from "@/types/file-system";
import { Icon } from "@iconify/vue";

const props = defineProps<{
  file: MediaFile;
}>();

const objectUrl = ref<string | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const loadMedia = async () => {
  if (objectUrl.value || error.value) return;

  try {
    isLoading.value = true;
    const file = await props.file.handle.getFile();
    objectUrl.value = URL.createObjectURL(file);
  } catch (err: any) {
    console.error("Failed to load media in lightbox:", err);
    error.value = "Failed to load media";
  } finally {
    isLoading.value = false;
  }
};

const unloadMedia = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
};

onMounted(() => {
  // We load immediately when this component is rendered by the lightbox
  // fslightbox-vue generally unmounts off-screen custom sources
  loadMedia();
});

onUnmounted(() => {
  unloadMedia();
});
</script>

<template>
  <div
    class="w-full h-full flex items-center justify-center relative p-4 bg-transparent select-none"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center text-white/70">
      <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
      <p class="text-sm">Loading {{ file.name }}...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center text-error bg-base-300 p-8 rounded-xl shadow-xl"
    >
      <Icon icon="heroicons-outline:exclamation-circle" class="h-12 w-12 mb-4" />
      <p>{{ error }}</p>
    </div>

    <!-- Loaded State -->
    <template v-else-if="objectUrl">
      <!-- Image -->
      <img
        v-if="file.type === 'image'"
        :src="objectUrl"
        :alt="file.name"
        class="max-w-[100vw] max-h-[100vh] object-contain select-none"
        draggable="false"
      />

      <!-- Video -->
      <video
        v-else-if="file.type === 'video'"
        :src="objectUrl"
        class="max-w-[100vw] max-h-[100vh] object-contain"
        controls
        autoplay
        playsinline
      ></video>
    </template>

    <!-- Title overlay at the top (Removed based on user request) -->
  </div>
</template>
