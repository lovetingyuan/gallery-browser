<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useFileSystem } from "@/composables/useFileSystem";
import { globalSyncWarning } from "@/composables/useGlobalState";
import TopBar from "@/components/TopBar.vue";
import FolderTree from "@/components/FolderTree.vue";
import MediaGrid from "@/components/MediaGrid.vue";

const savedGridSize = localStorage.getItem("gallery-grid-size");
const gridSize = ref(savedGridSize ? Number(savedGridSize) : 200);

const savedSidebarState = localStorage.getItem("gallery-sidebar-open");
const isSidebarOpen = ref(savedSidebarState ? savedSidebarState === "true" : true);

const savedSidebarWidth = localStorage.getItem("gallery-sidebar-width");
const sidebarWidth = ref(savedSidebarWidth ? Number(savedSidebarWidth) : 320);
const isDragging = ref(false);

const MIN_SIDEBAR_WIDTH = 200;
const FIRST_USE_GUIDE_KEY = "gallery-first-use-guide-dismissed";
const isFirstUseGuideOpen = ref(localStorage.getItem(FIRST_USE_GUIDE_KEY) !== "true");

watch(gridSize, (newVal) => {
  localStorage.setItem("gallery-grid-size", newVal.toString());
});

watch(isSidebarOpen, (newVal) => {
  localStorage.setItem("gallery-sidebar-open", newVal.toString());
});

watch(sidebarWidth, (newVal) => {
  localStorage.setItem("gallery-sidebar-width", newVal.toString());
});

const startDrag = () => {
  isDragging.value = true;
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) {
    return;
  }
  const MAX_SIDEBAR_WIDTH = Math.min(800, window.innerWidth * 0.8);

  let newWidth = e.clientX;
  if (newWidth < MIN_SIDEBAR_WIDTH) {
    newWidth = MIN_SIDEBAR_WIDTH;
  }
  if (newWidth > MAX_SIDEBAR_WIDTH) {
    newWidth = MAX_SIDEBAR_WIDTH;
  }

  sidebarWidth.value = newWidth;
};

const stopDrag = () => {
  isDragging.value = false;
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
};

const closeFirstUseGuide = () => {
  isFirstUseGuideOpen.value = false;
  localStorage.setItem(FIRST_USE_GUIDE_KEY, "true");
};

const {
  isScanning,
  error,
  rootNode,
  searchQuery,
  selectedDirectoryPath,
  selectedExtensions,
  sortBy,
  availableExtensions,
  filteredFiles,
  openDirectory,
  refreshDirectory,
  selectDirectory,
  currentDirHandle,
} = useFileSystem();
</script>

<template>
  <div class="h-screen w-full flex flex-col overflow-hidden bg-base-100">
    <TopBar
      :is-scanning="isScanning"
      :search-query="searchQuery"
      :available-extensions="availableExtensions"
      :selected-extensions="selectedExtensions"
      :grid-size="gridSize"
      :sort-by="sortBy"
      :is-sidebar-open="isSidebarOpen"
      :can-refresh="!!currentDirHandle"
      @update:search-query="searchQuery = $event"
      @update:selected-extensions="selectedExtensions = $event"
      @update:grid-size="gridSize = $event"
      @update:sort-by="sortBy = $event"
      @open-directory="openDirectory"
      @refresh-directory="refreshDirectory"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
    />

    <div class="flex-1 flex overflow-hidden relative">
      <div v-if="isFirstUseGuideOpen" class="modal modal-open">
        <div class="modal-box max-w-2xl">
          <div class="flex items-start gap-3">
            <div
              class="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary"
            >
              <Icon icon="heroicons-outline:shield-check" class="h-6 w-6" />
            </div>
            <div class="space-y-4">
              <div>
                <h2 class="text-2xl font-bold">欢迎使用 Gallery Browser</h2>
                <p class="mt-2 text-base-content/70">
                  感谢使用。这个网页是一个本地优先的图片和视频浏览工具，方便你直接在浏览器里查看电脑里的媒体文件，不需要导入到云端，也不用额外整理到其他地方。
                </p>
              </div>

              <div class="space-y-2">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                  简单使用方法
                </h3>
                <ul class="space-y-2 text-sm leading-6 text-base-content/80">
                  <li>1. 点击右上角的 “Select Folder”，选择你想浏览的本地文件夹。</li>
                  <li>2. 等待扫描完成后，可以在左侧切换目录，在顶部进行搜索、筛选和排序。</li>
                  <li>3. 点击缩略图即可查看图片或播放视频。</li>
                </ul>
              </div>

              <div class="rounded-2xl border border-success/20 bg-success/10 p-4">
                <div class="flex items-start gap-3">
                  <Icon
                    icon="heroicons-outline:lock-closed"
                    class="mt-0.5 h-5 w-5 shrink-0 text-success"
                  />
                  <div class="space-y-2">
                    <h3 class="font-semibold text-success">本地工具，数据不会离开你的设备</h3>
                    <p class="text-sm leading-6 text-base-content/80">
                      这个工具只会读取你主动授权的本地文件夹。所有文件数据、浏览内容和页面状态都保留在当前设备上，不会上传到任何远程服务，也不会经过服务器中转，你的文件始终留在本机。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button class="btn btn-primary" @click="closeFirstUseGuide">知道了，开始使用</button>
          </div>
        </div>
        <div class="modal-backdrop" @click="closeFirstUseGuide"></div>
      </div>

      <aside
        class="bg-base-100 flex-shrink-0 overflow-hidden"
        :class="[
          !isDragging ? 'transition-all duration-300' : '',
          isSidebarOpen ? 'border-r border-base-200' : 'border-r-0',
        ]"
        :style="{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }"
      >
        <div
          class="h-full overflow-y-auto custom-scrollbar p-2"
          :style="{ width: `${sidebarWidth}px` }"
        >
          <ul v-if="rootNode && !isScanning" class="menu bg-base-100 w-full rounded-box">
            <FolderTree
              :node="rootNode"
              :selected-path="selectedDirectoryPath"
              @select="selectDirectory"
            />
          </ul>

          <div v-else-if="!isScanning" class="p-4 text-center text-base-content/50 mt-10">
            <Icon icon="heroicons-outline:folder" class="h-12 w-12 mx-auto mb-4 opacity-50" />
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

      <div
        v-show="isSidebarOpen"
        class="relative w-0 z-10 flex-shrink-0 cursor-col-resize select-none"
        @mousedown.prevent="startDrag"
      >
        <div
          class="absolute top-0 bottom-0 -left-1 w-2 hover:bg-primary/50 transition-colors duration-200"
          :class="isDragging ? 'bg-primary/50' : 'bg-transparent'"
        ></div>
      </div>

      <main class="flex-1 bg-base-200/50 overflow-hidden relative">
        <MediaGrid :files="filteredFiles" :grid-size="gridSize" />
      </main>

      <div v-if="error || globalSyncWarning" class="toast toast-bottom toast-end z-50">
        <div v-if="error" class="alert alert-error">
          <Icon icon="heroicons-outline:x-circle" class="stroke-current shrink-0 h-6 w-6" />
          <span>{{ error }}</span>
        </div>

        <div v-if="globalSyncWarning" class="alert alert-warning">
          <Icon
            icon="heroicons-outline:exclamation-triangle"
            class="stroke-current shrink-0 h-6 w-6"
          />
          <span>部分文件似乎已在外部被修改，请点击右上角刷新按钮同步最新状态。</span>
          <button class="btn btn-sm btn-circle btn-ghost" @click="globalSyncWarning = false">
            ✕
          </button>
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
