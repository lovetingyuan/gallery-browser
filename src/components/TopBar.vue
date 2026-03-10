<script setup lang="ts">
import { Icon } from "@iconify/vue";

const props = defineProps<{
  onOpenDirectory: () => void;
  searchQuery: string;
  isScanning: boolean;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:searchQuery", target.value);
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

    <div class="flex-1 flex justify-end gap-4 px-4">
      <div class="form-control w-full max-w-xs sm:max-w-md">
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

      <button class="btn btn-primary" @click="onOpenDirectory" :disabled="isScanning">
        <span v-if="isScanning" class="loading loading-spinner"></span>
        <Icon v-else icon="heroicons-outline:folder-open" class="h-5 w-5 mr-1" />
        Select Folder
      </button>
    </div>
  </div>
</template>
