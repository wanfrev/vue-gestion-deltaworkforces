<template>
  <section v-if="ultimoRecibo" class="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:mb-6">
    <p class="text-sm font-medium text-gray-500">Resumen rápido</p>
    <p class="mt-1 text-lg text-gray-700">
      Tu último pago fue de
      <span class="font-bold text-green-700">${{ formatCurrency(ultimoRecibo.monto) }}</span>
      el día {{ ultimoRecibo.fecha_pago }}.
    </p>
    <DeltaButton class="mt-4 w-full sm:w-auto" @click="$emit('download-latest', ultimoRecibo)">
      Descargar Último PDF
    </DeltaButton>
  </section>

  <p v-if="loading" class="rounded-lg bg-white p-4 text-sm text-gray-500 shadow-sm">Cargando recibos...</p>

  <div v-else class="grid gap-4">
    <div
      v-for="recibo in recibos"
      :key="recibo.id"
      class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div class="space-y-1">
        <p class="text-sm text-gray-500">{{ recibo.periodo }}</p>
        <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :class="getStatusClass(recibo.estado)">
          {{ recibo.estado || 'Pagado' }}
        </span>
        <p class="text-lg font-semibold text-gray-700">Pago del {{ recibo.fecha_pago }}</p>
        <p class="mt-1 font-bold text-green-700">${{ formatCurrency(recibo.monto) }}</p>
      </div>

      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <DeltaButton variant="secondary" @click="$emit('view-details', recibo)">Ver en pantalla</DeltaButton>
        <DeltaButton @click="$emit('download-pdf', recibo)">Descargar PDF</DeltaButton>
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
  if (estado === 'En Procesamiento') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-green-100 text-green-700'
}
</script>
