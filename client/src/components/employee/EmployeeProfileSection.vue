<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 class="text-lg font-semibold text-slate-900">My Profile</h2>
    <p class="mt-1 text-sm text-slate-600">Main account information for Delta Workforces.</p>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ nombre || 'Not available' }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</p>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ username || 'Not available' }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
        <p class="mt-1 text-sm font-medium capitalize text-slate-800">{{ rol || 'Not available' }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Account status</p>
        <p class="mt-1 text-sm font-medium text-emerald-700">Active</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  nombre?: string
  username?: string
  rol?: string
}>()
</script>
