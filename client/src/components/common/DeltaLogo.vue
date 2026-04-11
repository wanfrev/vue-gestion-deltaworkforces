<template>
  <div class="inline-flex items-center" :class="centered ? 'justify-center' : ''">
    <img :src="logoSrc" alt="Delta Workforce" :class="logoClass" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import logoSrc from '../../assets/logo.png'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    centered?: boolean
  }>(),
  {
    size: 'md',
    centered: false,
  },
)

const logoClass = computed(() => {
  if (props.size === 'sm') {
    return 'h-12 w-auto max-w-[140px] object-contain'
  }

  if (props.size === '2xl') {
    return 'h-32 w-auto max-w-[420px] object-contain'
  }

  if (props.size === 'xl') {
    return 'h-28 w-auto max-w-[360px] object-contain'
  }

  if (props.size === 'lg') {
    return 'h-20 w-auto max-w-[280px] object-contain'
  }

  return 'h-16 w-auto max-w-[200px] object-contain'
})
</script>