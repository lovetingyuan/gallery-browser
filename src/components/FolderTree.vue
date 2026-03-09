<script setup lang="ts">
import { computed, ref } from "vue";
import type { DirectoryNode } from "@/types/file-system";

const props = defineProps<{
  node: DirectoryNode;
  selectedPath: string | null;
  level?: number;
}>();

const emit = defineEmits<{
  (e: "select", path: string): void;
}>();

const currentLevel = computed(() => props.level ?? 0);

// Open details by default if it's root or first level
const isOpen = ref(currentLevel.value < 2);

const handleToggle = (e: Event) => {
  const target = e.target as HTMLDetailsElement;
  isOpen.value = target.open;
};

const handleSelect = (path: string) => {
  emit("select", path);
};
</script>

<template>
  <li class="w-full">
    <!-- If there are children directories -->
    <details v-if="node.children.length > 0" :open="isOpen" @toggle="handleToggle">
      <summary
        class="cursor-pointer font-medium"
        :class="[
          selectedPath === node.path
            ? 'bg-primary text-primary-content hover:bg-primary'
            : 'hover:bg-base-200',
        ]"
        @click="handleSelect(node.path)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 mr-1 opacity-70"
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
        <span class="truncate" :title="node.name">{{ node.name || "Root" }}</span>
      </summary>
      <ul>
        <!-- Recursive call for children -->
        <FolderTree
          v-for="child in node.children"
          :key="child.path"
          :node="child"
          :selectedPath="selectedPath"
          :level="currentLevel + 1"
          @select="handleSelect"
        />
      </ul>
    </details>

    <!-- If it's a leaf node (no children directories) -->
    <a
      v-else
      class="cursor-pointer flex items-center gap-2"
      :class="[
        selectedPath === node.path
          ? 'bg-primary text-primary-content hover:bg-primary'
          : 'hover:bg-base-200',
      ]"
      @click="handleSelect(node.path)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 opacity-70"
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
      <span class="truncate" :title="node.name">{{ node.name }}</span>
    </a>
  </li>
</template>
