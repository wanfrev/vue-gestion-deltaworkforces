<template>
  <header class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Welcome back, {{ nombreCorto }}</h1>
    <p class="mt-1 text-sm text-slate-600">Review your payments, hours, and totals in one control center.</p>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  nombreCorto: string
}>()
</script>
