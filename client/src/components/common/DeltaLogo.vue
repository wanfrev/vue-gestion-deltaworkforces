<template>
  <div class="inline-flex items-center gap-3" :class="centered ? 'justify-center' : ''">
    <span :class="badgeClass">DW</span>
    <div class="leading-tight">
      <p :class="titleClass">Delta Workforces</p>
      <p v-if="showSubtitle" class="text-xs text-gray-500">Portal de nómina</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    centered?: boolean
    showSubtitle?: boolean
  }>(),
  {
    size: 'md',
    centered: false,
    showSubtitle: false,
  },
)

const badgeClass = computed(() => {
  if (props.size === 'sm') {
    return 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-delta-blue text-sm font-black tracking-wide text-white shadow-sm'
  }

  if (props.size === 'lg') {
    return 'inline-flex h-12 w-12 items-center justify-center rounded-xl bg-delta-blue text-base font-black tracking-wide text-white shadow-sm'
  }

  return 'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-delta-blue text-sm font-black tracking-wide text-white shadow-sm'
})

const titleClass = computed(() => {
  if (props.size === 'sm') {
    return 'text-xs font-semibold uppercase tracking-[0.16em] text-delta-blue'
  }

  if (props.size === 'lg') {
    return 'text-sm font-semibold uppercase tracking-[0.16em] text-delta-blue'
  }

  return 'text-xs font-semibold uppercase tracking-[0.16em] text-delta-blue'
})
</script>