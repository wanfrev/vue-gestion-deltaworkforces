<template>
  <section id="cargar-nomina">
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 class="text-lg font-semibold text-delta-text">Upload Payroll</h2>
      <p class="mt-2 text-sm text-gray-600">
        Upload an Excel file (.xlsx) or paste exported QuickBooks text. Supports CSV, TSV, or JSON.
      </p>

      <div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-3">
        <label class="text-xs font-semibold uppercase tracking-wide text-gray-600">Excel file</label>
        <input
          ref="dropzoneInput"
          type="file"
          accept=".xlsx,.xls"
          class="hidden"
          @change="onExcelFileChange"
        />

        <div
          role="button"
          tabindex="0"
          class="mt-2 rounded-xl border border-dashed px-4 py-5 text-center transition"
          :class="isDropzoneHover
            ? 'border-delta-blue bg-blue-50'
            : 'border-slate-300 bg-white hover:border-delta-blue/60 hover:bg-slate-50'"
          @click="onDropzoneClick"
          @keydown.enter.prevent="onDropzoneClick"
          @keydown.space.prevent="onDropzoneClick"
          @dragover.prevent="onDropzoneDragOver"
          @dragleave.prevent="onDropzoneDragLeave"
          @drop.prevent="onDropzoneDrop"
        >
          <Upload class="mx-auto h-5 w-5 text-slate-500" :size="20" :stroke-width="1.8" />
          <p class="mt-2 text-sm font-medium text-slate-700">Drag and drop your Excel file here</p>
          <p class="mt-1 text-xs text-slate-500">or click to select (.xlsx, .xls)</p>

          <p v-if="selectedExcelFile" class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            Selected file: {{ selectedExcelFile.name }}
          </p>
        </div>

        <div v-if="loadingImport" class="mt-3">
          <div class="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-delta-blue transition-all duration-300"
              :style="{ width: `${Math.max(importProgress, 8)}%` }"
            ></div>
          </div>
          <p class="mt-1 text-xs text-slate-500">Processing import... {{ importProgress }}%</p>
        </div>

        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            :value="defaultEmployeeName"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
            placeholder="Default employee name (optional)"
            @input="emit('update:defaultEmployeeName', ($event.target as HTMLInputElement).value)"
          />
          <input
            :value="defaultEmployeeQuickbooksId"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
            placeholder="Default QuickBooks ID (optional)"
            @input="emit('update:defaultEmployeeQuickbooksId', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <textarea
        :value="rawInput"
        :disabled="Boolean(selectedExcelFile)"
        class="mt-4 min-h-56 w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-700 outline-none transition focus:border-delta-blue"
        placeholder="Example headers: quickbooks_id, name, payment_date, net_total, regular_hours, hourly_rate, deductions, bonuses, position"
        @input="emit('update:rawInput', ($event.target as HTMLTextAreaElement).value)"
      />

      <div class="mt-4 flex flex-wrap gap-2">
        <DeltaButton :loading="loadingImport" @click="emit('import-week')">Import Weekly Payroll</DeltaButton>
        <DeltaButton variant="secondary" @click="emit('clear-input')">Clear</DeltaButton>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import DeltaButton from '../common/DeltaButton.vue'

defineProps<{
  selectedExcelFile: File | null
  loadingImport: boolean
  importProgress: number
  defaultEmployeeName: string
  defaultEmployeeQuickbooksId: string
  rawInput: string
}>()

const emit = defineEmits<{
  (event: 'update:defaultEmployeeName', value: string): void
  (event: 'update:defaultEmployeeQuickbooksId', value: string): void
  (event: 'update:rawInput', value: string): void
  (event: 'select-file', file: File | null): void
  (event: 'import-week'): void
  (event: 'clear-input'): void
}>()

const dropzoneInput = ref<HTMLInputElement | null>(null)
const isDropzoneHover = ref(false)

const onDropzoneClick = () => {
  dropzoneInput.value?.click()
}

const onDropzoneDragOver = () => {
  isDropzoneHover.value = true
}

const onDropzoneDragLeave = () => {
  isDropzoneHover.value = false
}

const onDropzoneDrop = (event: DragEvent) => {
  isDropzoneHover.value = false
  const file = event.dataTransfer?.files?.[0] ?? null
  emit('select-file', file)
}

const onExcelFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  emit('select-file', file)
  input.value = ''
}
</script>
