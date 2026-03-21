<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'rounded-lg px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
      fullWidth ? 'w-full' : '',
      variant === 'secondary'
        ? 'border border-delta-blue bg-white text-delta-blue hover:bg-delta-gray'
        : 'bg-delta-blue text-white hover:bg-delta-blue-dark',
    ]"
  >
    <slot v-if="!loading" />
    <span v-else>Cargando...</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary'
    fullWidth?: boolean
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    fullWidth: false,
    disabled: false,
    loading: false,
  },
)
</script>
