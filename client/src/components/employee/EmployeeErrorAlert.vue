<template>
  <p v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
    {{ errorMessage }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  errorMessage: string
}>()
</script>
