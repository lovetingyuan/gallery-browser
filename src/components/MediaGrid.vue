<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import type { MediaFile } from "@/types/file-system";
import MediaCard from "./MediaCard.vue";

// GLightbox imports
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import type { GLightboxInstance } from "glightbox";

const props = defineProps<{
  files: MediaFile[];
}>();

// Lightbox state
let lgInstance: GLightboxInstance | null = null;

// Registry of dynamically created Object URLs
const objectUrls = new Map<number, string>();

// A transparent 1x1 base64 GIF as placeholder
const transparentGif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const openLightbox = (index: number) => {
  if (lgInstance) {
    lgInstance.setElements(lightboxSources.value);
    lgInstance.openAt(index);
  }
};

// Map files to GLightbox dynamic source format
const lightboxSources = computed(() => {
  return props.files.map((file) => {
    // We use a transparent placeholder initially, and load the real file lazily
    return {
      href: file.type === "image" ? transparentGif : "",
      type: file.type === "image" ? "image" : "video",
      title: file.name,
      videoProvider: file.type === "video" ? "local" : undefined,
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

  lgInstance.on("slide_after_load", async (data: any) => {
    const { slideIndex, slideNode } = data;
    const fileToLoad = props.files[slideIndex];
    
    if (!fileToLoad || objectUrls.has(slideIndex)) return;

    try {
      // Lazy load the actual file
      const file = await fileToLoad.handle.getFile();
      const objectUrl = URL.createObjectURL(file);
      objectUrls.set(slideIndex, objectUrl);

      // Find the inner image or video element
      if (fileToLoad.type === "image") {
        const img = slideNode.querySelector("img");
        if (img) {
          img.src = objectUrl;
          // Refresh glightbox image zoom state if naturalWidth > offsetWidth
          if (img.naturalWidth > img.offsetWidth) {
            img.classList.add('zoomable');
          }
        }
      } else if (fileToLoad.type === "video") {
        const video = slideNode.querySelector("video.gvideo-local");
        if (video) {
          video.src = objectUrl;
          video.load();
        } else {
            const source = slideNode.querySelector("source");
            if (source) {
                source.src = objectUrl;
                const parentVideo = source.parentElement as HTMLVideoElement;
                if (parentVideo) {
                    parentVideo.load();
                }
            }
        }
      }
    } catch (err) {
      console.error("Failed to lazy load media for lightbox:", err);
    }
  });

  lgInstance.on("slide_removed", (index: number) => {
    // Unload specific slide if glightbox removes it from DOM
    const url = objectUrls.get(index);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.delete(index);
    }
  });

  lgInstance.on("close", () => {
    // Unload all dynamically created Object URLs when gallery closes
    for (const [index, url] of objectUrls.entries()) {
      URL.revokeObjectURL(url);
    }
    objectUrls.clear();
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
</style>
