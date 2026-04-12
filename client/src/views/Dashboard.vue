<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
      <EmployeeSidebar
        :seccion-activa="seccionActiva"
        :ultimo-pago-fecha-label="ultimoPagoFechaLabel"
        :horas-mes-label="horasMesLabel"
        :ytd-label="ytdMontoLabel"
        @change-section="cambiarSeccionEmpleado"
        @logout="logout"
      />

      <main class="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">
        <div class="mx-auto max-w-7xl">
          <EmployeeHeader :nombre-corto="nombreCorto" />

          <EmployeeErrorAlert :error-message="errorMessage" />

          <EmployeePaymentsSection
            v-if="seccionActiva === 'mis-pagos'"
            v-model:limite-recibos="limiteRecibos"
            :ytd-year="ytdYear"
            :ytd-monto-label="ytdMontoLabel"
            :ultimo-pago-monto-label="ultimoPagoMontoLabel"
            :ultimo-pago-fecha-label="ultimoPagoFechaLabel"
            :horas-mes-label="horasMesLabel"
            :etiqueta-mes="etiquetaMes"
            :recibo-seleccionado="reciboSeleccionado"
            :recibos="recibos"
            :loading="loading"
            :downloading-recibo-id="downloadingReciboId"
            :opciones-limite-recibos="opcionesLimiteRecibos"
            @change-limit="cambiarLimiteRecibos"
            @clear-selected="limpiarReciboSeleccionado"
            @print-selected="imprimirReciboEnPantalla"
            @view-details="abrirDetalle"
            @download-pdf="descargarRecibo"
          />

          <EmployeeProfileSection
            v-else
            :nombre="authStore.user?.nombre"
            :username="authStore.user?.username"
            :rol="authStore.user?.rol"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import EmployeeErrorAlert from '../components/employee/EmployeeErrorAlert.vue'
import EmployeeHeader from '../components/employee/EmployeeHeader.vue'
import EmployeePaymentsSection from '../components/employee/EmployeePaymentsSection.vue'
import EmployeeProfileSection from '../components/employee/EmployeeProfileSection.vue'
import EmployeeSidebar from '../components/employee/EmployeeSidebar.vue'
import { useEmployeeDashboardState } from '../composables/useEmployeeDashboardState'
import { usePayroll } from '../composables/usePayroll'
import { useAuth } from '../composables/useAuth'

const { logout, authStore } = useAuth()

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

const authNombre = computed(() => authStore.user?.nombre)

const {
  downloadingReciboId,
  seccionActiva,
  limiteRecibos,
  opcionesLimiteRecibos,
  nombreCorto,
  ultimoPagoFechaLabel,
  ultimoPagoMontoLabel,
  horasMesLabel,
  etiquetaMes,
  ytdYear,
  ytdMontoLabel,
  cambiarSeccionEmpleado,
  cargarInicialRecibos,
  cambiarLimiteRecibos,
  imprimirReciboEnPantalla,
  descargarRecibo,
  abrirDetalle,
} = useEmployeeDashboardState({
  recibos,
  authNombre,
  cargarRecibos,
  seleccionarRecibo,
  limpiarReciboSeleccionado,
  descargarPdf,
})

onMounted(async () => {
  await cargarInicialRecibos()
})
</script>
