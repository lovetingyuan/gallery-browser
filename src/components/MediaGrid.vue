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

// Helper functions for metadata
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleString();
};


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
      title: "",
      description: `<div class="text-left flex flex-col text-sm leading-tight">
        <div class="font-medium break-all mb-1">${file.name}</div>
        <div class="media-meta flex flex-col text-xs opacity-90 leading-tight gap-0.5">
          <div>加载中...</div>
        </div>
      </div>`,
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

      const sizeStr = formatBytes(file.size);
      const dateStr = formatDate(file.lastModified);

      const updateMeta = (resolution: string) => {
        const metaEl = slideNode.querySelector('.media-meta');
        if (metaEl) {
          metaEl.innerHTML = `
            <div>分辨率: ${resolution}</div>
            <div>大小: ${sizeStr}</div>
            <div>日期: ${dateStr}</div>
          `;
        }
      };

      // Find the inner image or video element
      if (fileToLoad.type === "image") {
        const img = slideNode.querySelector("img");
        if (img) {
          img.addEventListener('load', () => {
            updateMeta(`${img.naturalWidth} × ${img.naturalHeight}`);
            // Refresh glightbox image zoom state if naturalWidth > offsetWidth
            if (img.naturalWidth > img.offsetWidth) {
              img.classList.add('zoomable');
            }
          }, { once: true });
          img.src = objectUrl;
        }
      } else if (fileToLoad.type === "video") {
        const video = slideNode.querySelector("video.gvideo-local");
        if (video) {
          video.addEventListener('loadedmetadata', () => {
            updateMeta(`${video.videoWidth} × ${video.videoHeight}`);
          }, { once: true });
          video.src = objectUrl;
          video.load();
        } else {
          const source = slideNode.querySelector("source");
          if (source) {
            const parentVideo = source.parentElement as HTMLVideoElement;
            if (parentVideo) {
              parentVideo.addEventListener('loadedmetadata', () => {
                updateMeta(`${parentVideo.videoWidth} × ${parentVideo.videoHeight}`);
              }, { once: true });
            }
            source.src = objectUrl;
            if (parentVideo) {
              parentVideo.load();
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to lazy load media for lightbox:", err);
      const metaEl = slideNode.querySelector('.media-meta');
      if (metaEl) metaEl.innerHTML = "加载信息失败";
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
