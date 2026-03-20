<template>
  <div class="min-h-screen bg-[#F3F4F6] p-4 sm:p-6">
    <div class="mx-auto max-w-4xl">
      <header class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Mis Recibos de Pago</h1>
        <button
          class="rounded-lg bg-[#1448A8] px-4 py-2 text-white transition hover:bg-[#0F3B8C]"
          @click="$emit('logout')"
        >
          Cerrar Sesión
        </button>
      </header>

      <section v-if="ultimoRecibo" class="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:mb-6">
        <p class="text-sm font-medium text-gray-500">Resumen rápido</p>
        <p class="mt-1 text-lg text-gray-700">
          Tu último pago fue de
          <span class="font-bold text-[#90B548]">${{ formatCurrency(ultimoRecibo.monto) }}</span>
          el día {{ ultimoRecibo.fecha_pago }}.
        </p>
        <button
          class="mt-4 w-full rounded-lg bg-[#1448A8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0F3B8C] sm:w-auto"
          @click="$emit('download-latest', ultimoRecibo)"
        >
          Descargar Último PDF
        </button>
      </section>

      <div class="grid gap-4">
        <div
          v-for="recibo in recibos"
          :key="recibo.id"
          class="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div class="space-y-1">
            <p class="text-sm text-gray-500">{{ recibo.periodo }}</p>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :class="getStatusClass(recibo.estado)"
            >
              {{ recibo.estado || 'Pagado' }}
            </span>
            <p class="text-lg font-semibold text-gray-700">Pago del {{ recibo.fecha_pago }}</p>
            <p class="mt-1 font-bold text-[#90B548]">${{ formatCurrency(recibo.monto) }}</p>
          </div>

          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              class="rounded-md border border-[#1448A8] bg-white px-4 py-2 text-[#1448A8] transition hover:bg-blue-50"
              @click="$emit('view-details', recibo)"
            >
              Ver en pantalla
            </button>
            <button
              class="rounded-md bg-[#1448A8] px-4 py-2 text-white transition hover:bg-[#0F3B8C]"
              @click="$emit('download-pdf', recibo)"
            >
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <p class="mt-8 text-center text-sm italic text-gray-400">
        Mostrando las últimas 4 semanas de pago.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  recibos: {
    type: Array,
    required: true,
  },
})

defineEmits(['view-details', 'download-pdf', 'download-latest', 'logout'])

const ultimoRecibo = computed(() => props.recibos?.[0] ?? null)

const formatCurrency = (value) => Number(value).toFixed(2)

const getStatusClass = (estado) => {
  if (estado === 'En Procesamiento') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-green-100 text-green-700'
}
</script>
