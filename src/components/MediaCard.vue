<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { MediaFile } from "@/types/file-system";
import { getThumbnail } from "@/utils/thumbnail";

const props = defineProps<{
  file: MediaFile;
}>();

defineEmits<{
  (e: "click"): void;
}>();

const isVisible = ref(false);
const objectUrl = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const containerRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let loadTimer: ReturnType<typeof setTimeout> | null = null;
let isUnmounted = false;

const loadMedia = async () => {
  if (objectUrl.value || isLoading.value || error.value || isUnmounted) {
    return;
  }

  try {
    isLoading.value = true;
    const url = await getThumbnail(props.file);
    if (isUnmounted) {
      return;
    }
    objectUrl.value = url;
  } catch (err: any) {
    if (isUnmounted) {
      return;
    }
    console.error("Failed to load media:", err);
    error.value = "Failed to load media";
  } finally {
    if (!isUnmounted) {
      isLoading.value = false;
    }
  }
};

const unloadMedia = () => {
  if (objectUrl.value) {
    // Thumbnail cache manages the object URL lifecycle, so we just clear our reference
    objectUrl.value = null;
  }
};

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible.value = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (loadTimer) {
            clearTimeout(loadTimer);
          }
          // Delay load slightly so fast scrolling doesn't block the main thread
          loadTimer = setTimeout(() => {
            if (isVisible.value && !isUnmounted) {
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
  isUnmounted = true;
  if (loadTimer) {
    clearTimeout(loadTimer);
  }

  if (observer && containerRef.value) {
    observer.unobserve(containerRef.value);
    observer.disconnect();
  }
  unloadMedia();
});

const formatSize = (bytes?: number) => {
  if (bytes === undefined) {
    return "Unknown size";
  }
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) {
    return "Unknown date";
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const tooltipText = computed(() => {
  return `${props.file.name}\nSize: ${formatSize(props.file.size)}\nModified: ${formatDate(props.file.lastModified)}`;
});
</script>

<template>
  <div
    ref="containerRef"
    class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden aspect-square relative group cursor-pointer transition-transform hover:scale-[1.02]"
    :title="tooltipText"
    @click="$emit('click')"
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
      <Icon icon="heroicons-outline:exclamation-circle" class="h-8 w-8 mb-2" />
      <span class="text-xs">{{ error }}</span>
    </div>

    <!-- Loaded State -->
    <template v-else-if="objectUrl">
      <!-- Media Thumbnail (Both image and video use img tag for the thumbnail) -->
      <img
        :src="objectUrl"
        :alt="file.name"
        class="w-full h-full object-scale-down bg-base-300"
        loading="lazy"
      />

      <!-- Play Icon Overlay for Videos -->
      <div
        v-if="file.type === 'video'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          class="bg-black/50 rounded-full p-2 group-hover:bg-primary/80 transition-colors backdrop-blur-sm"
        >
          <Icon icon="heroicons-solid:play" class="w-8 h-8 text-white" />
        </div>
      </div>
    </template>

    <!-- Overlay Info (Always visible) -->
    <div
      class="absolute inset-x-0 top-0 bg-linear-to-b from-black/80 via-black/40 to-transparent pb-8 pt-2 px-2 text-white flex flex-col justify-start"
    >
      <div class="flex items-center gap-1">
        <Icon v-if="file.type === 'video'" icon="heroicons-outline:video-camera" class="h-4 w-4" />
        <Icon v-else icon="heroicons-outline:photograph" class="h-4 w-4" />
        <span class="text-xs truncate" :title="file.name">{{ file.name }}</span>
      </div>
    </div>
  </div>
</template>
