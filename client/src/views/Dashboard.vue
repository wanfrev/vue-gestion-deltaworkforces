<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
      <EmployeeSidebar
        :seccion-activa="seccionActiva"
        :ultimo-pago-fecha-label="ultimoPagoFechaLabel"
        :horas-mes-label="horasMesLabel"
        :ytd-label="ytdMontoLabel"
        :is-mobile-open="mobileSidebarOpen"
        :user-name="authStore.user?.nombre || 'Employee User'"
        :user-role="authStore.user?.rol || 'empleado'"
        @change-section="cambiarSeccionEmpleado"
        @close-mobile="cerrarMenuMovil"
        @logout="logout"
      />

      <main class="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">
        <div class="mx-auto max-w-7xl">
          <div class="mb-4 md:hidden">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
              @click="mobileSidebarOpen = true"
            >
              <Menu :size="17" :stroke-width="2" />
              <span>Menu</span>
            </button>
          </div>

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
import { computed, onMounted, ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import EmployeeErrorAlert from '../components/employee/EmployeeErrorAlert.vue'
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
const mobileSidebarOpen = ref(false)

const cerrarMenuMovil = () => {
  mobileSidebarOpen.value = false
}

const {
  downloadingReciboId,
  seccionActiva,
  limiteRecibos,
  opcionesLimiteRecibos,
  ultimoPagoFechaLabel,
  ultimoPagoMontoLabel,
  horasMesLabel,
  etiquetaMes,
  ytdYear,
  ytdMontoLabel,
  cambiarSeccionEmpleado: cambiarSeccionEmpleadoBase,
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

const cambiarSeccionEmpleado = (section: 'mis-pagos' | 'mi-perfil') => {
  cerrarMenuMovil()
  cambiarSeccionEmpleadoBase(section)
}

onMounted(async () => {
  await cargarInicialRecibos()
})
</script>
