<template>
  <section
    v-if="ultimoRecibo"
    class="mb-6 rounded-2xl border border-delta-blue/20 bg-white p-5 shadow-sm ring-1 ring-black/5 sm:mb-7 sm:p-6"
  >
    <p class="text-sm font-semibold text-gray-500">Resumen rápido</p>
    <p class="mt-2 text-xl text-gray-700">
      Tu último pago fue de
      <span class="text-2xl font-bold text-green-700">${{ formatCurrency(ultimoRecibo.monto) }}</span>
      el día {{ ultimoRecibo.fecha_pago }}.
    </p>
    <DeltaButton class="mt-5 w-full sm:w-auto" @click="$emit('download-latest', ultimoRecibo)">
      <span class="inline-flex items-center gap-1">
        <span aria-hidden="true">⬇</span>
        <span>Descargar Último PDF</span>
      </span>
    </DeltaButton>
  </section>

  <p v-if="loading" class="rounded-lg bg-white p-4 text-sm text-gray-500 shadow-sm">Cargando recibos...</p>

  <div v-else class="grid gap-5 sm:gap-6">
    <div
      v-for="recibo in recibos"
      :key="recibo.id"
      class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-7"
    >
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-gray-500">{{ recibo.periodo }}</p>
        <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :class="getStatusClass(recibo.estado)">
          {{ recibo.estado || 'Pagado' }}
        </span>
        <p class="text-lg font-semibold text-gray-700">Pago del {{ recibo.fecha_pago }}</p>
        <p class="mt-1 text-2xl font-bold text-green-700">${{ formatCurrency(recibo.monto) }}</p>
      </div>

      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <DeltaButton class="w-full sm:w-auto" variant="secondary" @click="$emit('view-details', recibo)">
          Ver en pantalla
        </DeltaButton>
        <DeltaButton class="w-full sm:w-auto" @click="$emit('download-pdf', recibo)">
          <span class="inline-flex items-center gap-1">
            <span aria-hidden="true">⬇</span>
            <span>Descargar PDF</span>
          </span>
        </DeltaButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Recibo } from '../../types/payroll'
import DeltaButton from './DeltaButton.vue'

const props = defineProps<{
  recibos: Recibo[]
  loading: boolean
}>()

defineEmits<{
  'view-details': [recibo: Recibo]
  'download-pdf': [recibo: Recibo]
  'download-latest': [recibo: Recibo]
}>()

const ultimoRecibo = computed(() => props.recibos?.[0] ?? null)

const formatCurrency = (value: number) => Number(value).toFixed(2)

const getStatusClass = (estado: string) => {
  const status = (estado || '').trim().toLowerCase()

  if (status === 'en procesamiento') {
    return 'bg-yellow-100 text-yellow-800'
  }

  if (status === 'revisar' || status === 'error' || status.includes('error')) {
    return 'bg-red-100 text-red-800'
  }

  return 'bg-green-100 text-green-800'
}
</script>
