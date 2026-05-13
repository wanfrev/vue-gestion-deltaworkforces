<template>
  <div class="h-screen bg-slate-900">
    <div class="flex h-screen flex-col md:flex-row overflow-hidden">
      <AdminSidebar
        :seccion-activa="seccionActiva"
        :recibos-count="recibosExistentes.length"
        :is-mobile-open="mobileSidebarOpen"
        :user-name="authStore.user?.nombre || 'Admin User'"
        :user-role="authStore.user?.rol || 'admin'"
        @change-section="cambiarSeccion"
        @close-mobile="cerrarMenuMovil"
        @logout="logout"
      />

      <main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8">
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
            <!-- Create User Section - Now at the top -->
            <div>
              <AdminCreateUserSection
                :employee-form="employeeForm"
                :creating-employee="creatingEmployee"
                :can-create-superadmin="isSuperadmin"
                @update:employee-form="updateEmployeeForm"
                @create-user="crearEmpleado"
                @clear-form="limpiarFormularioEmpleado"
              />
            </div>

            <!-- Admins and Superadmins List - Now second -->
            <div v-if="isSuperadmin" class="mt-4">
              <AdminPrivilegedUsersSection
                :users="privilegedUsers"
                :loading="loadingPrivilegedUsers"
                :deleting-user-id="deletingPrivilegedUserId"
                @delete-user="solicitarEliminarPrivilegedUser"
              />
            </div>

            <!-- Employee Directory - Now at the bottom -->
            <div class="mt-4">
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
                @change-password="solicitarCambioPassword"
                @delete-records="solicitarEliminarRegistros"
                @delete-employee="solicitarEliminarEmpleado"
              />
            </div>
          </section>

          <AdminPaymentsHistorySection
            v-else-if="seccionActiva === 'historial-pagos'"
            :loading-search="loadingSearch"
            :search="historialPagosSearch"
            :recibos-existentes-count="recibosExistentes.length"
            :historial-agrupado-por-empleado="historialAgrupadoPorEmpleado"
            :empleado-historial-abierto="empleadoHistorialAbierto"
            :recibo-seleccionado-id="reciboSeleccionado?.id ?? null"
            @update:search="updateHistorialPagosSearch"
            @toggle-employee-history="alternarEmpleadoHistorial"
            @toggle-recibo-history="alternarReciboHistorial"
            @view-all-payments="verTodosPagosEmpleado"
            @close-recibo="cerrarReciboActivo"
            @print-recibo="imprimirVista"
          />

          <AdminEmployeeAllPaymentsSection
            v-else-if="seccionActiva === 'historial-pagos-empleado'"
            :empleado="historialEmpleadoCompleto"
            :recibo-seleccionado-id="reciboSeleccionado?.id ?? null"
            @back="volverAHistorialPagos"
            @toggle-recibo-history="alternarReciboHistorial"
            @close-recibo="cerrarReciboActivo"
            @print-recibo="imprimirVista"
          />
        </div>
      </main>

      <div
        v-if="toast.visible"
        class="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Import complete</p>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ toast.message }}</p>
      </div>

      <AdminConfirmCard
        :visible="confirmDeleteRecordsVisible"
        title="Delete payroll records"
        :description="confirmDeleteRecordsText"
        confirm-label="Delete records"
        :danger="true"
        :loading="modalActionLoading"
        @cancel="cerrarModalesAccion"
        @confirm="confirmarEliminarRegistros"
      />

      <AdminConfirmCard
        :visible="confirmDeleteEmployeeVisible"
        title="Delete employee"
        :description="confirmDeleteEmployeeText"
        confirm-label="Delete employee"
        :danger="true"
        :loading="modalActionLoading"
        @cancel="cerrarModalesAccion"
        @confirm="confirmarEliminarEmpleado"
      />

      <AdminPasswordCard
        :visible="changePasswordVisible"
        :employee-name="selectedEmployeeAction?.nombre || 'Employee'"
        :loading="modalActionLoading"
        @cancel="cerrarModalesAccion"
        @confirm="confirmarCambioPassword"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Menu } from 'lucide-vue-next'
import AdminAlerts from '../components/admin/AdminAlerts.vue'
import AdminConfirmCard from '../components/admin/AdminConfirmCard.vue'
import AdminCreateUserSection from '../components/admin/AdminCreateUserSection.vue'
import AdminEmployeeAllPaymentsSection from '../components/admin/AdminEmployeeAllPaymentsSection.vue'
import AdminEmployeesOverviewSection from '../components/admin/AdminEmployeesOverviewSection.vue'
import AdminPasswordCard from '../components/admin/AdminPasswordCard.vue'
import AdminPaymentsHistorySection from '../components/admin/AdminPaymentsHistorySection.vue'
import AdminPayrollImportSection from '../components/admin/AdminPayrollImportSection.vue'
import AdminPrivilegedUsersSection from '../components/admin/AdminPrivilegedUsersSection.vue'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import { useAdminPayroll } from '../composables/useAdminPayroll'
import { useAdminUserManagement } from '../composables/useAdminUserManagement'
import { useAuth } from '../composables/useAuth'
import { type AdminSection, useAdminViewState } from '../composables/useAdminViewState'
import { ROLES } from '../constants/roles'

const { logout, authStore } = useAuth()
const isSuperadmin = computed(() => authStore.user?.rol === ROLES.SUPERADMIN)

const {
  rawInput,
  selectedExcelFile,
  defaultEmployeeName,
  defaultEmployeeQuickbooksId,
  search,
  recibosExistentes,
  reciboSeleccionado,
  empleadosDirectorio,
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
  historialPagosSearch,
  menuEmpleadoAbiertoId,
  empleadosConRegistros,
  empleadosFiltrados,
  fechaUltimaNominaLabel,
  totalPayoutMensual,
  quickbooksSyncStats,
  empleadosDataGrid,
  historialAgrupadoPorEmpleado,
  historialEmpleadoCompleto,
  formatMoney,
  cambiarSeccion: cambiarSeccionBase,
  buscarRecibos: buscarRecibosBase,
  alternarMenuEmpleado,
  cerrarMenuEmpleado,
  abrirHistorialEmpleado,
  updateHistorialPagosSearch,
  alternarReciboHistorial,
  alternarEmpleadoHistorial,
  verTodosPagosEmpleado,
  volverAHistorialPagos,
  cerrarReciboActivo,
  imprimirVista,
} = useAdminViewState({
  search,
  recibosExistentes,
  reciboSeleccionado,
  empleadosDirectorio,
  cargarRecibosAdmin,
  seleccionarRecibo,
})

const {
  employeeForm,
  creatingEmployee,
  deletingEmployeeId,
  privilegedUsers,
  loadingPrivilegedUsers,
  deletingPrivilegedUserId,
  updateEmployeeForm,
  limpiarFormularioEmpleado,
  crearEmpleado,
  eliminarRegistrosDesdeMenu,
  cambiarPasswordDesdeMenu,
  eliminarEmpleadoDesdeMenu,
  cargarUsuariosPrivilegiados,
  eliminarPrivilegedUserDesdeMenu,
} = useAdminUserManagement({
  isSuperadmin: isSuperadmin.value,
  limpiarMensajes,
  setSuccessMessage: (message) => {
    successMessage.value = message
  },
  setErrorMessage: (message) => {
    errorMessage.value = message
  },
  cargarRecibosAdmin,
})

interface EmployeeActionCandidate {
  employeeId: number
  nombre: string
  registros: number
}

const selectedEmployeeAction = ref<EmployeeActionCandidate | null>(null)
const confirmDeleteRecordsVisible = ref(false)
const confirmDeleteEmployeeVisible = ref(false)
const changePasswordVisible = ref(false)
const modalActionLoading = ref(false)
const mobileSidebarOpen = ref(false)
const selectedPrivilegedUserAction = ref<{ id: number; username: string; role: 'superadmin' | 'admin' } | null>(null)

const cerrarMenuMovil = () => {
  mobileSidebarOpen.value = false
}

const confirmDeleteRecordsText = computed(() => {
  if (!selectedEmployeeAction.value) {
    return ''
  }

  const { nombre, registros } = selectedEmployeeAction.value
  return `${registros} payroll record(s) for ${nombre} will be deleted. This action cannot be undone.`
})

const confirmDeleteEmployeeText = computed(() => {
  if (!selectedEmployeeAction.value) {
    return ''
  }

  const { nombre } = selectedEmployeeAction.value
  return `Delete employee ${nombre}? This will remove the user profile and all linked payroll records. This action cannot be undone.`
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

  if (isSuperadmin.value) {
    await cargarUsuariosPrivilegiados()
  }
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

const cerrarModalesAccion = () => {
  if (modalActionLoading.value) {
    return
  }

  selectedEmployeeAction.value = null
  confirmDeleteRecordsVisible.value = false
  confirmDeleteEmployeeVisible.value = false
  changePasswordVisible.value = false
}

const solicitarEliminarRegistros = (empleado: EmployeeActionCandidate) => {
  cerrarMenuEmpleado()
  selectedEmployeeAction.value = empleado
  confirmDeleteEmployeeVisible.value = false
  changePasswordVisible.value = false
  confirmDeleteRecordsVisible.value = true
}

const solicitarEliminarEmpleado = (empleado: EmployeeActionCandidate) => {
  cerrarMenuEmpleado()
  selectedEmployeeAction.value = empleado
  confirmDeleteRecordsVisible.value = false
  changePasswordVisible.value = false
  confirmDeleteEmployeeVisible.value = true
}

const solicitarCambioPassword = (empleado: EmployeeActionCandidate) => {
  cerrarMenuEmpleado()
  selectedEmployeeAction.value = empleado
  confirmDeleteRecordsVisible.value = false
  confirmDeleteEmployeeVisible.value = false
  changePasswordVisible.value = true
}

const solicitarEliminarPrivilegedUser = (user: { id: number; username: string; role: 'superadmin' | 'admin' }) => {
  selectedPrivilegedUserAction.value = user
  void confirmarEliminarPrivilegedUser()
}

const confirmarEliminarPrivilegedUser = async () => {
  if (!selectedPrivilegedUserAction.value) {
    return
  }

  await eliminarPrivilegedUserDesdeMenu(selectedPrivilegedUserAction.value)
  selectedPrivilegedUserAction.value = null
}

const confirmarEliminarRegistros = async () => {
  if (!selectedEmployeeAction.value) {
    return
  }

  modalActionLoading.value = true

  try {
    await eliminarRegistrosDesdeMenu(selectedEmployeeAction.value)
  } finally {
    modalActionLoading.value = false
    cerrarModalesAccion()
  }
}

const confirmarEliminarEmpleado = async () => {
  if (!selectedEmployeeAction.value) {
    return
  }

  modalActionLoading.value = true

  try {
    await eliminarEmpleadoDesdeMenu(selectedEmployeeAction.value)
  } finally {
    modalActionLoading.value = false
    cerrarModalesAccion()
  }
}

const confirmarCambioPassword = async (password: string) => {
  if (!selectedEmployeeAction.value) {
    return
  }

  modalActionLoading.value = true

  try {
    await cambiarPasswordDesdeMenu(selectedEmployeeAction.value, password)
  } finally {
    modalActionLoading.value = false
    cerrarModalesAccion()
  }
}

const cambiarSeccion = (seccion: AdminSection) => {
  limpiarMensajes()
  toast.value.visible = false
  cerrarMenuMovil()

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
