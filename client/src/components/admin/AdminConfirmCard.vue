<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[1px]"
    @click.self="emit('cancel')"
  >
    <article class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ description }}</p>

      <div class="mt-5 flex justify-end gap-2">
        <DeltaButton variant="secondary" :disabled="loading" @click="emit('cancel')">
          {{ cancelLabel }}
        </DeltaButton>
        <DeltaButton
          :loading="loading"
          :class="danger ? '!bg-red-600 !text-white hover:!bg-red-700' : ''"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </DeltaButton>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import DeltaButton from '../common/DeltaButton.vue'

withDefaults(
  defineProps<{
    visible: boolean
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
    loading: false,
  },
)

const emit = defineEmits<{
  (event: 'confirm'): void
  (event: 'cancel'): void
}>()
</script>
