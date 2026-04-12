<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[1px]"
    @click.self="onCancel"
  >
    <article class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <h3 class="text-lg font-semibold text-slate-900">Change Password</h3>
      <p class="mt-2 text-sm leading-relaxed text-slate-600">
        Set a new password for <span class="font-medium text-slate-800">{{ employeeName }}</span>.
      </p>

      <div class="mt-4">
        <label for="admin-password-input" class="mb-1 block text-sm font-medium text-slate-700">New password</label>
        <input
          id="admin-password-input"
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="Minimum 8 characters"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
          @keyup.enter="onConfirm"
        />
        <p v-if="localError" class="mt-2 text-xs text-red-600">{{ localError }}</p>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <DeltaButton variant="secondary" :disabled="loading" @click="onCancel">Cancel</DeltaButton>
        <DeltaButton :loading="loading" @click="onConfirm">Update Password</DeltaButton>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import DeltaButton from '../common/DeltaButton.vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    employeeName: string
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  (event: 'confirm', value: string): void
  (event: 'cancel'): void
}>()

const password = ref('')
const localError = ref('')

watch(
  () => props.visible,
  (nextVisible) => {
    if (nextVisible) {
      password.value = ''
      localError.value = ''
    }
  },
)

const onCancel = () => {
  password.value = ''
  localError.value = ''
  emit('cancel')
}

const onConfirm = () => {
  const normalized = password.value.trim()

  if (normalized.length < 8) {
    localError.value = 'Password must be at least 8 characters.'
    return
  }

  localError.value = ''
  emit('confirm', normalized)
}
</script>
