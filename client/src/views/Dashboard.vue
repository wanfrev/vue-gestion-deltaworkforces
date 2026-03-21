<template>
  <div class="min-h-screen bg-delta-gray p-4 sm:p-6">
    <div class="mx-auto max-w-5xl">
      <AppHeader
        title="Mis Recibos de Pago"
        subtitle="Consulta y descarga tus últimas semanas de nómina."
        @logout="logout"
      />

      <p v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>

      <ReciboDetalle
        v-if="reciboSeleccionado"
        :recibo="reciboSeleccionado"
        @back="limpiarReciboSeleccionado"
        @print="imprimirReciboEnPantalla"
      />

      <template v-else>
        <PayrollTable
          :recibos="recibos"
          :loading="loading"
          @view-details="seleccionarRecibo"
          @download-pdf="descargarRecibo"
          @download-latest="descargarUltimo"
        />
        <p class="mt-8 text-center text-sm italic text-gray-500">Mostrando las últimas 4 semanas de pago.</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import PayrollTable from '../components/common/PayrollTable.vue'
import ReciboDetalle from '../components/payroll/ReciboDetalle.vue'
import { usePayroll } from '../composables/usePayroll'
import { useAuth } from '../composables/useAuth'
import type { Recibo } from '../types/payroll'

const { logout } = useAuth()

const {
  recibos,
  reciboSeleccionado,
  loading,
  errorMessage,
  cargarRecibos,
  seleccionarRecibo,
  limpiarReciboSeleccionado,
  descargarPdf,
} = usePayroll()

onMounted(async () => {
  await cargarRecibos()
})

const imprimirReciboEnPantalla = () => {
  window.print()
}

const descargarRecibo = async (recibo: Recibo) => {
  const descargado = await descargarPdf(recibo)

  if (!descargado) {
    seleccionarRecibo(recibo)
    await nextTick()
    window.print()
  }
}

const descargarUltimo = async (recibo: Recibo) => {
  await descargarRecibo(recibo)
}
</script>
