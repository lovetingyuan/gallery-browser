<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { MediaFile } from "@/types/file-system";

const props = defineProps<{
  file: MediaFile;
}>();

const isVisible = ref(false);
const objectUrl = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const containerRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const loadMedia = async () => {
  if (objectUrl.value || isLoading.value || error.value) return;

  try {
    isLoading.value = true;
    const file = await props.file.handle.getFile();
    objectUrl.value = URL.createObjectURL(file);
  } catch (err: any) {
    console.error("Failed to load media:", err);
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
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible.value = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Delay load slightly so fast scrolling doesn't block the main thread
          setTimeout(() => {
            if (isVisible.value) {
              loadMedia();
            }
          }, 50);
        } else {
          // Unload when out of view to free memory
          // Only do this for images, videos are more tricky with state
          // Actually, for a photo browser, if we scroll far away, we should clean up
          // but maybe with a bit of margin
        }
      });
    },
    {
      rootMargin: "200px 0px", // Pre-load 200px before entering viewport
      threshold: 0.01,
    },
  );

  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (observer && containerRef.value) {
    observer.unobserve(containerRef.value);
    observer.disconnect();
  }
  unloadMedia();
});

const handlePlay = (e: Event) => {
  const video = e.target as HTMLVideoElement;
  video.play().catch(() => {});
};

const handlePause = (e: Event) => {
  const video = e.target as HTMLVideoElement;
  video.pause();
};
</script>

<template>
  <div
    ref="containerRef"
    class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden h-48 md:h-64 relative group cursor-pointer transition-transform hover:scale-[1.02]"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-base-200">
      <span class="loading loading-spinner text-primary"></span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="absolute inset-0 flex flex-col items-center justify-center bg-base-200 text-error p-4 text-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-8 w-8 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="text-xs">{{ error }}</span>
    </div>

    <!-- Loaded State -->
    <template v-else-if="objectUrl">
      <!-- Image -->
      <img
        v-if="file.type === 'image'"
        :src="objectUrl"
        :alt="file.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />

      <!-- Video -->
      <video
        v-else-if="file.type === 'video'"
        :src="objectUrl"
        class="w-full h-full object-cover"
        muted
        loop
        playsinline
        @mouseenter="handlePlay"
        @mouseleave="handlePause"
      ></video>
    </template>

    <!-- Overlay Info (Always visible) -->
    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2 px-2 text-white flex flex-col justify-end"
    >
      <div class="flex items-center gap-1">
        <svg
          v-if="file.type === 'video'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span class="text-xs truncate" :title="file.name">{{ file.name }}</span>
      </div>
    </div>
  </div>
</template>
