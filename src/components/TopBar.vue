<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { SortOption } from "@/composables/useFileSystem";

const props = defineProps<{
  onOpenDirectory: () => void;
  onRefreshDirectory: () => void;
  canRefresh: boolean;
  searchQuery: string;
  isScanning: boolean;
  availableExtensions: string[];
  selectedExtensions: string[];
  gridSize: number;
  sortBy: SortOption;
  isSidebarOpen: boolean;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:selectedExtensions": [value: string[]];
  "update:gridSize": [value: number];
  "update:sortBy": [value: SortOption];
  "toggle-sidebar": [];
}>();

const handleGridSizeInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:gridSize", Number(target.value));
};

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("update:sortBy", target.value as SortOption);
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:searchQuery", target.value);
};

const toggleExtension = (ext: string) => {
  const current = new Set(props.selectedExtensions);
  if (current.has(ext)) {
    current.delete(ext);
  } else {
    current.add(ext);
  }
  emit("update:selectedExtensions", Array.from(current));
};
</script>

<template>
  <div class="navbar bg-base-200 shadow-sm z-50 border-b border-base-200 p-0">
    <div
      class="flex-none flex items-center self-stretch transition-all duration-300 overflow-hidden"
      :class="isSidebarOpen ? 'w-64 md:w-80 border-r border-base-200 px-4' : 'w-14 border-r-0 px-2'"
    >
      <button
        class="btn btn-ghost btn-circle shrink-0 mr-1"
        @click="emit('toggle-sidebar')"
        title="Toggle Sidebar"
      >
        <Icon icon="heroicons-outline:menu" class="h-5 w-5 text-base-content/70" />
      </button>
      <a
        class="btn btn-ghost text-xl normal-case flex items-center gap-2 text-primary whitespace-nowrap overflow-hidden text-ellipsis px-1 transition-opacity duration-300"
        :class="{ 'opacity-0 w-0 p-0': !isSidebarOpen }"
      >
        <!-- Folder Icon -->
        <Icon icon="heroicons-outline:folder" class="h-6 w-6 text-primary shrink-0" />
        Gallery Browser
      </a>
    </div>

    <div class="flex-1 flex justify-end gap-4 px-4 items-center">
      <div class="flex gap-2 w-full max-w-xs sm:max-w-md items-center">
        <div class="form-control flex-1">
          <div class="relative w-full">
            <input
              type="text"
              placeholder="Search files..."
              class="input input-bordered w-full pl-10"
              :value="searchQuery"
              @input="handleInput"
            />
            <Icon
              icon="heroicons-outline:search"
              class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
            />
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-2 px-2">
          <Icon icon="heroicons-outline:view-grid" class="h-5 w-5 text-base-content/70" />
          <input
            type="range"
            min="100"
            max="400"
            :value="gridSize"
            @input="handleGridSizeInput"
            class="range range-sm range-primary w-24"
          />
        </div>

        <div class="hidden sm:flex">
          <select
            class="select select-bordered max-w-xs"
            :value="sortBy"
            @change="handleSortChange"
          >
            <option value="time_desc">Newest First</option>
            <option value="time_asc">Oldest First</option>
            <option value="size_desc">Largest First</option>
            <option value="size_asc">Smallest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>

        <div class="dropdown dropdown-end" v-if="availableExtensions.length > 0">
          <div tabindex="0" role="button" class="btn btn-square btn-outline">
            <Icon icon="heroicons-outline:funnel" class="h-5 w-5" />
          </div>
          <ul
            tabindex="0"
            class="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto"
          >
            <li v-for="ext in availableExtensions" :key="ext">
              <label class="label cursor-pointer flex justify-start gap-3 p-2">
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="selectedExtensions.includes(ext)"
                  @change="toggleExtension(ext)"
                />
                <span class="label-text">.{{ ext }}</span>
              </label>
            </li>
          </ul>
        </div>
      </div>

      <button
        v-if="canRefresh"
        class="btn btn-square btn-ghost shrink-0"
        @click="onRefreshDirectory"
        :disabled="isScanning"
        title="Refresh Folder"
      >
        <Icon
          icon="heroicons-outline:refresh"
          class="h-5 w-5"
          :class="{ 'animate-spin': isScanning }"
        />
      </button>

      <button class="btn btn-primary shrink-0" @click="onOpenDirectory" :disabled="isScanning">
        <span v-if="isScanning" class="loading loading-spinner"></span>
        <Icon v-else icon="heroicons-outline:folder-open" class="h-5 w-5 mr-1" />
        Select Folder
      </button>
    </div>
  </div>
</template>
