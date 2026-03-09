<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <div class="min-h-screen bg-base-100 flex flex-col">
    <div class="navbar bg-base-200 shadow-sm">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">Gallery Browser</a>
      </div>
    </div>
    <main class="flex-1 container mx-auto p-4">
      <RouterView />
    </main>
  </div>
</template>
