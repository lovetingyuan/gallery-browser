<script setup lang="ts">
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <button class="btn btn-primary" @click="onOpenDirectory" :disabled="isScanning">
        <span v-if="isScanning" class="loading loading-spinner"></span>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
          />
        </svg>
        Select Folder
      </button>
    </div>
  </div>
</template>
