<script setup lang="ts">
import { Icon } from "@iconify/vue";

const props = defineProps<{
  onOpenDirectory: () => void;
  searchQuery: string;
  isScanning: boolean;
  availableExtensions: string[];
  selectedExtensions: string[];
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:selectedExtensions": [value: string[]];
}>();

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
      class="w-64 md:w-80 flex-none px-4 flex items-center border-r border-base-200 self-stretch"
    >
      <a
        class="btn btn-ghost text-xl normal-case flex items-center gap-2 text-primary whitespace-nowrap overflow-hidden text-ellipsis"
      >
        <!-- Folder Icon -->
        <Icon icon="heroicons-outline:folder" class="h-6 w-6 text-primary" />
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
        <div class="dropdown dropdown-end" v-if="availableExtensions.length > 0">
          <div tabindex="0" role="button" class="btn btn-square btn-outline">
            <Icon icon="heroicons-outline:funnel" class="h-5 w-5" />
          </div>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto"
          >
            <li v-for="ext in availableExtensions" :key="ext">
              <label class="label cursor-pointer flex justify-start gap-3 p-2">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="selectedExtensions.includes(ext)"
                  @change="toggleExtension(ext)"
                />
                <span class="label-text">.{{ ext }}</span>
              </label>
            </li>
          </ul>
        </div>
      </div>

      <button class="btn btn-primary shrink-0" @click="onOpenDirectory" :disabled="isScanning">
        <span v-if="isScanning" class="loading loading-spinner"></span>
        <Icon v-else icon="heroicons-outline:folder-open" class="h-5 w-5 mr-1" />
        Select Folder
      </button>
    </div>
  </div>
</template>
