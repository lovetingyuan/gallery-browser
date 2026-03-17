<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import type { MediaFile } from "@/types/file-system";
import MediaCard from "./MediaCard.vue";
import { useVirtualList, useElementSize } from "@vueuse/core";

// GLightbox imports
import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";
import type { GLightboxInstance } from "glightbox";
import { globalSyncWarning } from "@/composables/useGlobalState";

const props = defineProps<{
  files: MediaFile[];
  gridSize: number;
}>();

// Lightbox state
let lgInstance: GLightboxInstance | null = null;
let currentActiveIndex = -1;

// Registry of dynamically created Object URLs
const objectUrls = new Map<number, string>();

// Global click listener for delegating events like copy filename
let globalClickListener: ((e: MouseEvent) => void) | null = null;

// Custom zoom state
let currentScale = 1;
const zoomStep = 0.15;
const maxScale = 5;
const minScale = 0.1;

let wheelListener: ((e: WheelEvent) => void) | null = null;

// A transparent 1x1 base64 GIF as placeholder
const transparentGif =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Helper functions for metadata
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleString();
};

const openLightbox = (index: number) => {
  if (lgInstance) {
    currentActiveIndex = index;
    lgInstance.setElements(lightboxSources.value);
    lgInstance.openAt(index);
  }
};

const updateZoom = () => {
  const currentSlide = document.querySelector(".gslide.current");
  if (!currentSlide) {
    return;
  }
  const img = currentSlide.querySelector(".gslide-media img") as HTMLElement;
  if (img) {
    img.style.transform = `scale(${currentScale})`;
    img.style.transition = "transform 0.15s ease-out";
  }
};

const updateZoomControlsVisibility = () => {
  const wrapper = document.getElementById("zoom-controls-wrapper");
  if (!wrapper) {
    return;
  }
  const isVideo = props.files[currentActiveIndex]?.type === "video";
  wrapper.style.display = isVideo ? "none" : "flex";
};

const setupCustomZoom = () => {
  const container = document.getElementById("glightbox-body");
  if (!container) {
    return;
  }

  // Add zoom buttons if they don't exist
  let toolbar = container.querySelector(".gslide-description");
  if (!toolbar) {
    toolbar = container.querySelector(".ginner-container");
  }

  if (toolbar && !document.getElementById("custom-zoom-controls")) {
    const controls = document.createElement("div");
    controls.id = "custom-zoom-controls";
    controls.className =
      "absolute bottom-4 right-4 flex gap-2 bg-black/50 p-2 rounded-lg text-white pointer-events-auto items-center";
    controls.style.zIndex = "99999";
    controls.innerHTML = `
      <button id="download-btn" class="p-2 hover:bg-white/20 rounded cursor-pointer" title="下载当前媒体文件">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </button>
      <div id="zoom-controls-wrapper" class="flex items-center gap-2">
        <div class="w-px h-5 bg-white/30 mx-1"></div>
        <button id="zoom-out-btn" class="p-2 hover:bg-white/20 rounded cursor-pointer" title="缩小 (Mouse Wheel Down)">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <div id="zoom-level-display" class="flex items-center justify-center w-12 text-sm font-medium">100%</div>
        <button id="zoom-in-btn" class="p-2 hover:bg-white/20 rounded cursor-pointer" title="放大 (Mouse Wheel Up)">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </button>
        <button id="zoom-reset-btn" class="p-2 hover:bg-white/20 rounded cursor-pointer" title="重置">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>
      </div>
    `;
    container.appendChild(controls);

    const updateDisplay = () => {
      const display = document.getElementById("zoom-level-display");
      if (display) {
        display.textContent = `${Math.round(currentScale * 100)}%`;
      }
      updateZoom();
    };

    document.getElementById("zoom-in-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentScale < maxScale) {
        currentScale += zoomStep;
        updateDisplay();
      }
    });

    document.getElementById("zoom-out-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentScale > minScale) {
        currentScale -= zoomStep;
        updateDisplay();
      }
    });

    document.getElementById("zoom-reset-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      currentScale = 1;
      updateDisplay();
    });

    document.getElementById("download-btn")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (currentActiveIndex === -1 || !props.files[currentActiveIndex]) {
        return;
      }

      const fileItem = props.files[currentActiveIndex];
      if (!fileItem) {
        return;
      }

      const btn = e.currentTarget as HTMLButtonElement;

      try {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";

        let url = objectUrls.get(currentActiveIndex);
        let createdUrl = false;

        if (!url) {
          const file = await fileItem.handle.getFile();
          url = URL.createObjectURL(file);
          createdUrl = true;
        }

        const a = document.createElement("a");
        a.href = url;
        a.download = fileItem.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (createdUrl) {
          URL.revokeObjectURL(url);
        }
      } catch (err: any) {
        console.error("Download failed:", err);
        if (err.name === "NotFoundError" || err.name === "NotAllowedError") {
          globalSyncWarning.value = true;
        }
      } finally {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
      }
    });
  }

  updateZoomControlsVisibility();

  const updateDisplay = () => {
    const display = document.getElementById("zoom-level-display");
    if (display) {
      display.textContent = `${Math.round(currentScale * 100)}%`;
    }
    updateZoom();
  };

  if (!wheelListener) {
    wheelListener = (e: WheelEvent) => {
      const isLightboxOpen = document.body.classList.contains("glightbox-open");
      if (!isLightboxOpen) {
        return;
      }

      const currentSlide = document.querySelector(".gslide.current");
      if (!currentSlide) {
        return;
      }

      const mediaNode = currentSlide.querySelector(".gslide-media img");
      if (!mediaNode) {
        return;
      } // Only zoom images

      e.preventDefault();

      if (e.deltaY < 0) {
        if (currentScale < maxScale) {
          currentScale += zoomStep;
        }
      } else {
        if (currentScale > minScale) {
          currentScale -= zoomStep;
        }
        // ensure exact 1.0 is easily reached
        if (Math.abs(currentScale - 1) < zoomStep) {
          // snap to 1 if close
          if (currentScale > 1 && e.deltaY > 0) {
            currentScale = 1;
          }
          if (currentScale < 1 && e.deltaY < 0) {
            currentScale = 1;
          }
        }
      }

      updateDisplay();
    };
    window.addEventListener("wheel", wheelListener, { passive: false });
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
        <div class="font-medium break-all mb-1 flex items-start gap-2">
          <span>${file.name}</span>
          <button class="copy-filename-btn p-1 hover:bg-white/20 rounded cursor-pointer shrink-0 transition-colors" title="复制文件名">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
        <div class="media-meta inline-flex items-center gap-[20px] text-xs opacity-90 leading-tight">
          <div>加载中...</div>
        </div>
      </div>`,
      videoProvider: file.type === "video" ? "local" : undefined,
    };
  });
});

onMounted(() => {
  globalClickListener = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".copy-filename-btn");
    if (btn) {
      e.stopPropagation();
      const file = props.files[currentActiveIndex];
      if (file) {
        navigator.clipboard
          .writeText(file.name)
          .then(() => {
            if (!btn.hasAttribute("data-original-html")) {
              btn.setAttribute("data-original-html", btn.innerHTML);
            }
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              if (document.body.contains(btn)) {
                btn.innerHTML = btn.getAttribute("data-original-html") || "";
                btn.removeAttribute("data-original-html");
              }
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy filename: ", err);
          });
      }
    }
  };
  document.addEventListener("click", globalClickListener);

  lgInstance = GLightbox({
    touchNavigation: true,
    loop: false,
    zoomable: true,
    draggable: true,
  });

  lgInstance.on("slide_changed", (data: any) => {
    currentActiveIndex = data.current.index;
    currentScale = 1;
    updateZoomControlsVisibility();
    const display = document.getElementById("zoom-level-display");
    if (display) {
      display.textContent = "100%";
    }
    const currentSlide = document.querySelector(".gslide.current");
    if (currentSlide) {
      const img = currentSlide.querySelector(".gslide-media img") as HTMLElement;
      if (img) {
        img.style.transform = `scale(1)`;
      }
    }
  });

  lgInstance.on("open", () => {
    currentScale = 1;
    setTimeout(() => {
      setupCustomZoom();
    }, 100);
  });

  lgInstance.on("slide_after_load", async (data: any) => {
    const { slideIndex, slideNode } = data;
    const fileToLoad = props.files[slideIndex];

    if (!fileToLoad || objectUrls.has(slideIndex)) {
      // even if cached, when loaded we might need to apply custom zoom
      if (currentScale !== 1) {
        setTimeout(updateZoom, 50);
      }
      return;
    }

    try {
      // Lazy load the actual file
      const file = await fileToLoad.handle.getFile();
      const objectUrl = URL.createObjectURL(file);
      objectUrls.set(slideIndex, objectUrl);

      const sizeStr = formatBytes(file.size);
      const dateStr = formatDate(file.lastModified);

      const updateMeta = (resolution: string) => {
        const metaEl = slideNode.querySelector(".media-meta");
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
          img.addEventListener(
            "load",
            () => {
              updateMeta(`${img.naturalWidth} × ${img.naturalHeight}`);
              // Refresh glightbox image zoom state if naturalWidth > offsetWidth
              if (img.naturalWidth > img.offsetWidth) {
                img.classList.add("zoomable");
              }
            },
            { once: true },
          );
          img.src = objectUrl;
        }
      } else if (fileToLoad.type === "video") {
        const video = slideNode.querySelector("video.gvideo-local");
        if (video) {
          video.addEventListener(
            "loadedmetadata",
            () => {
              updateMeta(`${video.videoWidth} × ${video.videoHeight}`);
            },
            { once: true },
          );
          video.src = objectUrl;
          video.load();
        } else {
          const source = slideNode.querySelector("source");
          if (source) {
            const parentVideo = source.parentElement as HTMLVideoElement;
            if (parentVideo) {
              parentVideo.addEventListener(
                "loadedmetadata",
                () => {
                  updateMeta(`${parentVideo.videoWidth} × ${parentVideo.videoHeight}`);
                },
                { once: true },
              );
            }
            source.src = objectUrl;
            if (parentVideo) {
              parentVideo.load();
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to lazy load media for lightbox:", err);
      if (err.name === "NotFoundError" || err.name === "NotAllowedError") {
        globalSyncWarning.value = true;
      }
      const metaEl = slideNode.querySelector(".media-meta");
      if (metaEl) {
        metaEl.innerHTML = "加载信息失败";
      }
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
    currentScale = 1;
  });
});

onUnmounted(() => {
  if (globalClickListener) {
    document.removeEventListener("click", globalClickListener);
  }
  if (wheelListener) {
    window.removeEventListener("wheel", wheelListener);
  }
  if (lgInstance) {
    lgInstance.destroy();
  }
});

// Virtual List setup
const containerWidth = ref(0);

const columns = computed(() => {
  if (!containerWidth.value) {
    return 1;
  }
  const availableWidth = containerWidth.value - 32; // p-4 adds 16px padding on left/right
  const cols = Math.floor((availableWidth + 16) / (props.gridSize + 16));
  return Math.max(1, cols);
});

const rowHeight = computed(() => {
  if (!containerWidth.value) {
    return props.gridSize + 16;
  }
  const availableWidth = containerWidth.value - 32;
  const cols = columns.value;
  const itemWidth = (availableWidth - (cols - 1) * 16) / cols;
  return itemWidth + 16; // aspect-square item height + 16px row gap
});

const rows = computed(() => {
  const result = [];
  const cols = columns.value;
  for (let i = 0; i < props.files.length; i += cols) {
    result.push(props.files.slice(i, i + cols));
  }
  return result;
});

const { list, containerProps, wrapperProps } = useVirtualList(rows, {
  itemHeight: () => rowHeight.value,
  overscan: 5,
});

const { width } = useElementSize(containerProps.ref);
watch(
  width,
  (newWidth) => {
    containerWidth.value = newWidth;
  },
  { immediate: true },
);
</script>

<template>
  <div v-bind="containerProps" class="h-full overflow-y-auto p-4 custom-scrollbar">
    <div
      v-if="files.length === 0"
      class="flex flex-col items-center justify-center h-full text-base-content/50"
    >
      <Icon icon="heroicons-outline:inbox" class="h-16 w-16 mb-4" />
      <p class="text-lg font-medium">No media files found</p>
      <p class="text-sm">Select a directory or adjust your search.</p>
      <a
        href="https://github.com/lovetingyuan/gallery-browser"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-6 text-base-content/50 hover:text-base-content transition-colors"
        title="GitHub Repository"
      >
        <Icon icon="mdi:github" class="h-8 w-8" />
      </a>
    </div>

    <div v-else v-bind="wrapperProps">
      <div
        v-for="row in list"
        :key="row.index"
        class="grid gap-4 mb-4"
        :style="{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          height: `${rowHeight - 16}px`,
        }"
      >
        <MediaCard
          v-for="(file, i) in row.data"
          :key="file.id"
          :file="file"
          @click="openLightbox(row.index * columns + i)"
        />
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
