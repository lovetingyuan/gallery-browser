<script setup lang="ts">
import { computed, ref, watch, createApp, h, nextTick } from "vue";
import type { App } from "vue";
import { Icon } from "@iconify/vue";
import type { MediaFile } from "@/types/file-system";
import MediaCard from "./MediaCard.vue";
import LightboxMedia from "./LightboxMedia.vue";

// lightGallery imports
import Lightgallery from "lightgallery/vue";
import lgZoom from "lightgallery/plugins/zoom";
import lgVideo from "lightgallery/plugins/video";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-video.css";

const props = defineProps<{
  files: MediaFile[];
}>();

// Lightbox state
const plugins = [lgZoom, lgVideo];
let lgInstance: any = null;

// Registry of dynamically mounted Vue instances for custom sources
const mountedApps = new Map<number, App>();

const onInit = (detail: any) => {
  lgInstance = detail.instance;
};

const openLightbox = (index: number) => {
  if (lgInstance) {
    // lgInstance.refresh is required when dynamic gallery is updated
    lgInstance.refresh(lightboxSources.value);
    lgInstance.openGallery(index);
  }
};

// Map files to LightGallery dynamic source format
const lightboxSources = computed(() => {
  return props.files.map((file, index) => {
    // We don't use real src here to prevent memory leak
    // Instead we use subHtml / html to mount our component
    return {
      src: "", // Empty src to avoid default behavior
      thumb: "",
      // Provide a container ID that we will mount our component into
      html: `<div id="lg-slide-container-${index}" class="lg-custom-slide-container w-full h-full"></div>`,
      subHtml: `<h4>${file.name}</h4>`,
      // Custom data to pass to event handlers
      slideIndex: index,
    };
  });
});

// Event handlers to manage lazy loading
const onAfterAppendSlide = (detail: any) => {
  const { index } = detail;
  const containerId = `lg-slide-container-${index}`;

  // Use nextTick to ensure the HTML from 'html' property is inserted into DOM
  nextTick(() => {
    const container = document.getElementById(containerId);
    if (container && !mountedApps.has(index) && props.files[index]) {
      const fileToMount = props.files[index];
      if (!fileToMount) return;

      // Create a new Vue app instance for the LightboxMedia component
      const app = createApp({
        render() {
          return h(LightboxMedia, { file: fileToMount });
        },
      });

      app.mount(container);
      mountedApps.set(index, app);
    }
  });
};

const onBeforeClose = () => {
  // Unmount all dynamically created Vue instances when gallery closes
  for (const [index, app] of mountedApps.entries()) {
    app.unmount();
  }
  mountedApps.clear();
};

const onBeforeSlide = (detail: any) => {
  // We can preload adjacent slides here if needed,
  // but lightGallery will trigger onAfterAppendSlide for preloaded slides anyway
};

// Simple pagination to avoid rendering 10,000 DOM elements at once
// even if we have lazy loading, too many elements kill the browser
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
      <Icon icon="heroicons-outline:inbox" class="h-16 w-16 mb-4" />
      <p class="text-lg font-medium">No media files found</p>
      <p class="text-sm">Select a directory or adjust your search.</p>
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <MediaCard
        v-for="(file, index) in displayedFiles"
        :key="file.id"
        :file="file"
        @click="openLightbox(index)"
      />
    </div>

    <!-- Loading more indicator -->
    <div v-if="displayLimit < files.length" class="flex justify-center p-4">
      <span class="loading loading-spinner text-primary"></span>
    </div>

    <!-- Fullscreen Lightbox -->
    <Lightgallery
      :settings="{
        dynamic: true,
        dynamicEl: lightboxSources,
        plugins: plugins,
        speed: 500,
        hideScrollbar: true,
        download: false, // Custom component doesn't support built-in download easily without actual URLs
        counter: true,
      }"
      @onInit="onInit"
      @onAfterAppendSlide="onAfterAppendSlide"
      @onBeforeClose="onBeforeClose"
      @onBeforeSlide="onBeforeSlide"
    />
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

/* Ensure custom slide container takes up full space */
:deep(.lg-custom-slide-container) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
