<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
    :class="[
      'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-delta-blue/35',
      fullWidth ? 'w-full' : '',
      variant === 'secondary'
        ? 'border border-delta-blue bg-white text-delta-blue hover:bg-delta-gray'
        : gradient
          ? 'bg-linear-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-900/30 hover:from-blue-800 hover:to-blue-900'
          : 'bg-delta-blue text-white hover:bg-delta-blue-dark',
    ]"
  >
    <slot v-if="!loading" />
    <span v-else-if="spinnerOnly" class="inline-flex items-center" aria-live="polite" aria-label="Cargando">
      <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3"></circle>
        <path
          class="opacity-90"
          fill="currentColor"
          d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
        ></path>
      </svg>
      <span class="sr-only">Cargando</span>
    </span>
    <span v-else>Cargando...</span>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: [event: MouseEvent]
}>()

withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary'
    fullWidth?: boolean
    disabled?: boolean
    loading?: boolean
    gradient?: boolean
    spinnerOnly?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    fullWidth: false,
    disabled: false,
    loading: false,
    gradient: false,
    spinnerOnly: false,
  },
)
</script>
