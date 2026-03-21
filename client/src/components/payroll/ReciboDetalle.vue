<template>
  <div class="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
    <header class="mb-8 flex items-start justify-between border-b border-gray-200 pb-4">
      <div>
        <h2 class="text-2xl font-bold text-delta-text">Recibo de Pago</h2>
        <p class="text-sm text-gray-500">{{ recibo.periodo }}</p>
      </div>
      <div class="text-right text-sm text-gray-600">
        <p><span class="font-semibold">Folio:</span> #{{ recibo.id }}</p>
        <p><span class="font-semibold">Fecha de pago:</span> {{ recibo.fecha_pago }}</p>
      </div>
    </header>

    <section class="mb-8 grid gap-3 rounded-lg border border-gray-200 p-4">
      <div class="flex justify-between text-gray-700">
        <span>Horas regulares</span>
        <span>{{ recibo.detalles.horas_regulares }}</span>
      </div>
      <div class="flex justify-between text-gray-700">
        <span>Pago por hora</span>
        <span>${{ formatCurrency(recibo.detalles.pago_hora) }}</span>
      </div>
      <div class="flex justify-between text-gray-700">
        <span>Bonos</span>
        <span class="text-green-700">+ ${{ formatCurrency(recibo.detalles.bonos) }}</span>
      </div>
      <div class="flex justify-between text-gray-700">
        <span>Deducciones</span>
        <span class="text-red-600">- ${{ formatCurrency(recibo.detalles.deducciones) }}</span>
      </div>
    </section>

    <section class="mb-6 rounded-lg bg-delta-gray p-4">
      <p class="text-sm text-gray-600">Total depositado</p>
      <p class="text-3xl font-bold text-delta-blue">${{ formatCurrency(recibo.monto) }}</p>
    </section>

    <footer class="flex gap-3 print:hidden">
      <DeltaButton variant="secondary" @click="$emit('back')">Volver al dashboard</DeltaButton>
      <DeltaButton @click="$emit('print')">Descargar PDF</DeltaButton>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { Recibo } from '../../types/payroll'
import DeltaButton from '../common/DeltaButton.vue'

defineProps<{
  recibo: Recibo
}>()

defineEmits<{
  back: []
  print: []
}>()

const formatCurrency = (value: number) => Number(value).toFixed(2)
</script>
