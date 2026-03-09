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
  <div class="navbar bg-base-200 shadow-sm z-50">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl normal-case flex items-center gap-2">
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

    <div class="flex-none gap-4 mr-4">
      <div class="form-control">
        <input
          type="text"
          placeholder="Search files..."
          class="input input-bordered w-24 md:w-auto"
          :value="searchQuery"
          @input="handleInput"
        />
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
