<script setup lang="ts">
import { computed, ref, watch, createApp, h, nextTick, onMounted, onUnmounted } from "vue";
import type { App } from "vue";
import { Icon } from "@iconify/vue";
import type { MediaFile } from "@/types/file-system";
import MediaCard from "./MediaCard.vue";
import LightboxMedia from "./LightboxMedia.vue";

// GLightbox imports
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import type { GLightboxInstance } from "glightbox";

const props = defineProps<{
  files: MediaFile[];
}>();

// Lightbox state
let lgInstance: GLightboxInstance | null = null;

// Registry of dynamically mounted Vue instances for custom sources
const mountedApps = new Map<number, App>();

const openLightbox = (index: number) => {
  if (lgInstance) {
    lgInstance.setElements(lightboxSources.value);
    lgInstance.openAt(index);
  }
};

// Map files to GLightbox dynamic source format
const lightboxSources = computed(() => {
  return props.files.map((file, index) => {
    return {
      content: `<div id="glightbox-slide-container-${index}" class="glightbox-custom-slide-container w-full h-full"></div>`,
      width: "100vw",
      height: "100vh",
      title: file.name,
    };
  });
});

onMounted(() => {
  lgInstance = GLightbox({
    touchNavigation: true,
    loop: false,
    zoomable: true,
    draggable: true,
  });

  lgInstance.on("slide_after_load", (data: any) => {
    const { slideIndex } = data;
    const containerId = `glightbox-slide-container-${slideIndex}`;

    nextTick(() => {
      const container = document.getElementById(containerId);
      if (container && !mountedApps.has(slideIndex) && props.files[slideIndex]) {
        const fileToMount = props.files[slideIndex];
        if (!fileToMount) return;

        // Create a new Vue app instance for the LightboxMedia component
        const app = createApp({
          render() {
            return h(LightboxMedia, { file: fileToMount });
          },
        });

        app.mount(container);
        mountedApps.set(slideIndex, app);
      }
    });
  });

  lgInstance.on("slide_removed", (index: number) => {
    // Unmount specific slide if glightbox removes it from DOM
    const app = mountedApps.get(index);
    if (app) {
      app.unmount();
      mountedApps.delete(index);
    }
  });

  lgInstance.on("close", () => {
    // Unmount all dynamically created Vue instances when gallery closes
    for (const [index, app] of mountedApps.entries()) {
      app.unmount();
    }
    mountedApps.clear();
  });
});

onUnmounted(() => {
  if (lgInstance) {
    lgInstance.destroy();
  }
});

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
:deep(.glightbox-custom-slide-container) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
