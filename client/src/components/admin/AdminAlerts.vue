<template>
  <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    {{ errorMessage }}
  </p>
  <p
    v-if="successMessage"
    class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
  >
    {{ successMessage }}
  </p>
  <p
    v-if="autoCreationNotice"
    class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800"
  >
    {{ autoCreationNotice }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  errorMessage: string
  successMessage: string
  autoCreationNotice: string
}>()
</script>
