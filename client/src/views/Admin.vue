<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar
        :seccion-activa="seccionActiva"
        :recibos-count="recibosExistentes.length"
        @change-section="cambiarSeccion"
        @logout="logout"
      />

      <main class="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">
        <div class="mx-auto max-w-7xl">
          <AdminHeader />

          <AdminAlerts
            :error-message="errorMessage"
            :success-message="successMessage"
            :auto-creation-notice="autoCreationNotice"
          />

          <AdminPayrollImportSection
            v-if="seccionActiva === 'cargar-nomina'"
            :selected-excel-file="selectedExcelFile"
            :loading-import="loadingImport"
            :import-progress="importProgress"
            :default-employee-name="defaultEmployeeName"
            :default-employee-quickbooks-id="defaultEmployeeQuickbooksId"
            :raw-input="rawInput"
            @update:default-employee-name="updateDefaultEmployeeName"
            @update:default-employee-quickbooks-id="updateDefaultEmployeeQuickbooksId"
            @update:raw-input="updateRawInput"
            @select-file="onSelectPayrollFile"
            @import-week="importarSemana"
            @clear-input="limpiarEntrada"
          />

          <section v-else-if="seccionActiva === 'gestionar-empleados'" id="gestionar-empleados" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <AdminEmployeesOverviewSection
              :search="search"
              :loading-search="loadingSearch"
              :empleados-filtrados-count="empleadosFiltrados.length"
              :empleados-con-registros-count="empleadosConRegistros.length"
              :fecha-ultima-nomina-label="fechaUltimaNominaLabel"
              :total-payout-mensual-label="formatMoney(totalPayoutMensual)"
              :quickbooks-sync-stats="quickbooksSyncStats"
              :empleados-data-grid="empleadosDataGrid"
              :menu-empleado-abierto-id="menuEmpleadoAbiertoId"
              :deleting-employee-id="deletingEmployeeId"
              @update:search="updateSearch"
              @search="buscarRecibos"
              @close-menu="cerrarMenuEmpleado"
              @toggle-menu="alternarMenuEmpleado"
              @open-history="abrirHistorialEmpleado"
              @delete-records="eliminarRegistrosDesdeMenu"
            />

            <div class="mt-4">
              <AdminCreateUserSection
                :employee-form="employeeForm"
                :creating-employee="creatingEmployee"
                @update:employee-form="updateEmployeeForm"
                @create-user="crearEmpleado"
                @clear-form="limpiarFormularioEmpleado"
              />
            </div>
          </section>

          <AdminPaymentsHistorySection
            v-else-if="seccionActiva === 'historial-pagos'"
            :loading-search="loadingSearch"
            :recibos-existentes-count="recibosExistentes.length"
            :historial-agrupado-por-empleado="historialAgrupadoPorEmpleado"
            :empleado-historial-abierto="empleadoHistorialAbierto"
            :recibo-seleccionado-id="reciboSeleccionado?.id ?? null"
            @toggle-employee-history="alternarEmpleadoHistorial"
            @toggle-recibo-history="alternarReciboHistorial"
            @close-recibo="cerrarReciboActivo"
            @print-recibo="imprimirVista"
          />

          <section v-else id="configuracion" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-semibold text-delta-text">Settings</h2>
            <p class="mt-2 text-sm text-gray-600">Maintenance actions for the admin session.</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <DeltaButton variant="secondary" @click="limpiarEntrada">Clear input</DeltaButton>
              <DeltaButton variant="secondary" @click="limpiarMensajes">Clear messages</DeltaButton>
            </div>
          </section>
        </div>
      </main>

      <div
        v-if="toast.visible"
        class="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Import complete</p>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ toast.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import AdminAlerts from '../components/admin/AdminAlerts.vue'
import AdminCreateUserSection from '../components/admin/AdminCreateUserSection.vue'
import AdminEmployeesOverviewSection from '../components/admin/AdminEmployeesOverviewSection.vue'
import AdminHeader from '../components/admin/AdminHeader.vue'
import AdminPaymentsHistorySection from '../components/admin/AdminPaymentsHistorySection.vue'
import AdminPayrollImportSection from '../components/admin/AdminPayrollImportSection.vue'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import DeltaButton from '../components/common/DeltaButton.vue'
import { useAdminPayroll } from '../composables/useAdminPayroll'
import { useAdminUserManagement } from '../composables/useAdminUserManagement'
import { useAuth } from '../composables/useAuth'
import { type AdminSection, useAdminViewState } from '../composables/useAdminViewState'

const { logout } = useAuth()

const {
  rawInput,
  selectedExcelFile,
  defaultEmployeeName,
  defaultEmployeeQuickbooksId,
  search,
  recibosExistentes,
  reciboSeleccionado,
  loadingImport,
  importProgress,
  loadingSearch,
  errorMessage,
  successMessage,
  autoCreationNotice,
  importarNomina,
  cargarRecibosAdmin,
  seleccionarRecibo,
  limpiarEntrada,
  limpiarMensajes,
  setExcelFile,
} = useAdminPayroll()

const {
  seccionActiva,
  empleadoHistorialAbierto,
  menuEmpleadoAbiertoId,
  empleadosConRegistros,
  empleadosFiltrados,
  fechaUltimaNominaLabel,
  totalPayoutMensual,
  quickbooksSyncStats,
  empleadosDataGrid,
  historialAgrupadoPorEmpleado,
  formatMoney,
  cambiarSeccion: cambiarSeccionBase,
  buscarRecibos: buscarRecibosBase,
  alternarMenuEmpleado,
  cerrarMenuEmpleado,
  abrirHistorialEmpleado,
  alternarReciboHistorial,
  alternarEmpleadoHistorial,
  cerrarReciboActivo,
  imprimirVista,
} = useAdminViewState({
  search,
  recibosExistentes,
  reciboSeleccionado,
  cargarRecibosAdmin,
  seleccionarRecibo,
})

const {
  employeeForm,
  creatingEmployee,
  deletingEmployeeId,
  updateEmployeeForm,
  limpiarFormularioEmpleado,
  crearEmpleado,
  eliminarRegistrosDesdeMenu,
} = useAdminUserManagement({
  limpiarMensajes,
  setSuccessMessage: (message) => {
    successMessage.value = message
  },
  setErrorMessage: (message) => {
    errorMessage.value = message
  },
  cargarRecibosAdmin,
  cerrarMenuEmpleado,
})

const toast = ref({
  visible: false,
  message: '',
})

let toastTimer: ReturnType<typeof setTimeout> | null = null
let messageTimer: ReturnType<typeof setTimeout> | null = null

const showToast = (message: string) => {
  toast.value = {
    visible: true,
    message,
  }

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 3200)
}

onUnmounted(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  if (messageTimer) {
    clearTimeout(messageTimer)
  }
})

watch([successMessage, errorMessage, autoCreationNotice], ([success, error, notice]) => {
  const hasMessage = Boolean(success || error || notice)

  if (!hasMessage) {
    if (messageTimer) {
      clearTimeout(messageTimer)
      messageTimer = null
    }

    return
  }

  if (messageTimer) {
    clearTimeout(messageTimer)
  }

  messageTimer = setTimeout(() => {
    limpiarMensajes()
    messageTimer = null
  }, 7000)
})

onMounted(async () => {
  await cargarRecibosAdmin('', 200)
})

const updateDefaultEmployeeName = (value: string) => {
  defaultEmployeeName.value = value
}

const updateDefaultEmployeeQuickbooksId = (value: string) => {
  defaultEmployeeQuickbooksId.value = value
}

const updateRawInput = (value: string) => {
  rawInput.value = value
}

const updateSearch = (value: string) => {
  search.value = value
}

const cambiarSeccion = (seccion: AdminSection) => {
  limpiarMensajes()
  toast.value.visible = false

  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }

  void cambiarSeccionBase(seccion)
}

const importarSemana = async () => {
  const importado = await importarNomina()

  if (!importado.ok) {
    return
  }

  const employeeName = importado.employeeName || 'employee'
  const linkedText = importado.linkedRecords === 1 ? '1 record' : `${importado.linkedRecords} records`

  showToast(`${linkedText} linked to ${employeeName} successfully.`)

  rawInput.value = ''

  await cargarRecibosAdmin('', 200)
}

const buscarRecibos = async () => {
  limpiarMensajes()
  await buscarRecibosBase()
}

const isExcelFile = (file: File): boolean => {
  const lowerName = file.name.toLowerCase()
  return lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
}

const applyExcelFile = (file: File | null) => {
  if (!file) {
    setExcelFile(null)
    return
  }

  if (!isExcelFile(file)) {
    errorMessage.value = 'Only Excel files are allowed (.xlsx or .xls).'
    return
  }

  setExcelFile(file)
}

const onSelectPayrollFile = (file: File | null) => {
  applyExcelFile(file)
}
</script>
