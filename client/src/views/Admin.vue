<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
      <aside class="w-full border-b border-slate-800 bg-slate-900 text-slate-100 md:w-72 md:border-r md:border-b-0">
        <div class="sticky top-0 px-5 py-6 md:px-6">
          <div class="mb-6 flex items-center gap-3">
            <DeltaLogo size="lg" />
          </div>

          <nav class="space-y-2 text-sm">
            <button
              type="button"
              class="w-full rounded-lg border px-3 py-2 text-left font-medium transition"
              :class="seccionActiva === 'cargar-nomina'
                ? 'border-blue-500/40 bg-slate-800 text-slate-100'
                : 'border-transparent text-slate-300 hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100'"
              @click="cambiarSeccion('cargar-nomina')"
            >
              Cargar Nómina
            </button>
            <button
              type="button"
              class="w-full rounded-lg border px-3 py-2 text-left font-medium transition"
              :class="seccionActiva === 'gestionar-empleados'
                ? 'border-blue-500/40 bg-slate-800 text-slate-100'
                : 'border-transparent text-slate-300 hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100'"
              @click="cambiarSeccion('gestionar-empleados')"
            >
              Gestionar Empleados
            </button>
            <button
              type="button"
              class="w-full rounded-lg border px-3 py-2 text-left font-medium transition"
              :class="seccionActiva === 'historial-pagos'
                ? 'border-blue-500/40 bg-slate-800 text-slate-100'
                : 'border-transparent text-slate-300 hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100'"
              @click="cambiarSeccion('historial-pagos')"
            >
              Historial de Pagos
            </button>
            <button
              type="button"
              class="w-full rounded-lg border px-3 py-2 text-left font-medium transition"
              :class="seccionActiva === 'configuracion'
                ? 'border-blue-500/40 bg-slate-800 text-slate-100'
                : 'border-transparent text-slate-300 hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100'"
              @click="cambiarSeccion('configuracion')"
            >
              Configuración
            </button>
          </nav>

          <div class="mt-6 rounded-xl border border-slate-700 bg-slate-800/70 p-3 text-xs text-slate-300">
            <p class="font-semibold text-slate-100">Resumen rápido</p>
            <p class="mt-2">Registros en preview: {{ previewRecibos.length }}</p>
            <p>Válidos para importar: {{ validItems.length }}</p>
            <p>Recibos cargados: {{ recibosExistentes.length }}</p>
          </div>

          <DeltaButton class="mt-6 w-full" variant="secondary" @click="logout">Cerrar Sesión</DeltaButton>
        </div>
      </aside>

      <main class="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">
        <div class="mx-auto max-w-7xl">
          <header class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <h1 class="text-2xl font-bold text-delta-text">Oficina de Nómina</h1>
            <p class="mt-1 text-sm text-gray-600">Importa datos desde QuickBooks/Excel, previsualiza, publica recibos y administra historial.</p>
          </header>

          <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ errorMessage }}
          </p>
          <p
            v-if="successMessage"
            class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
          >
            {{ successMessage }}
          </p>

          <section v-if="seccionActiva === 'cargar-nomina'" id="cargar-nomina" class="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-semibold text-delta-text">Cargar Nómina</h2>
              <p class="mt-2 text-sm text-gray-600">
                Sube un archivo Excel (.xlsx) o pega texto exportado desde QuickBooks. Acepta CSV, TSV o JSON.
              </p>

              <div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-3">
                <label class="text-xs font-semibold uppercase tracking-wide text-gray-600">Archivo Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  class="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-delta-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  @change="onExcelFileChange"
                />
                <p v-if="selectedExcelFile" class="mt-2 text-xs text-gray-600">
                  Archivo seleccionado: {{ selectedExcelFile.name }}
                </p>

                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    v-model="defaultEmployeeName"
                    type="text"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                    placeholder="Nombre por defecto (opcional)"
                  />
                  <input
                    v-model="defaultEmployeeQuickbooksId"
                    type="text"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                    placeholder="QuickBooks ID por defecto (opcional)"
                  />
                </div>
              </div>

              <textarea
                v-model="rawInput"
                :disabled="Boolean(selectedExcelFile)"
                class="mt-4 min-h-56 w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-700 outline-none transition focus:border-delta-blue"
                placeholder="Ejemplo encabezados: quickbooks_id, nombre, fecha_pago, total_neto, horas_regulares, pago_hora, deducciones, bonos, cargo"
              />

              <div class="mt-4 flex flex-wrap gap-2">
                <DeltaButton :loading="loadingPreview" variant="secondary" @click="generarYSeleccionarPreview">
                  Generar vista previa
                </DeltaButton>
                <DeltaButton :loading="loadingImport" @click="importarSemana">Importar Nómina de la Semana</DeltaButton>
                <DeltaButton variant="secondary" @click="limpiarEntrada">Limpiar</DeltaButton>
              </div>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-semibold text-delta-text">Vista previa rápida</h2>
              <p class="mt-2 text-sm text-gray-600">Selecciona una fila para revisar cómo se mostrará el recibo.</p>

              <div v-if="!previewRecibos.length" class="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                Aún no hay datos previsualizados.
              </div>

              <div v-else class="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                <button
                  v-for="recibo in previewRecibos"
                  :key="recibo.id"
                  type="button"
                  class="w-full rounded-xl border border-gray-200 p-3 text-left transition hover:border-delta-blue/30 hover:bg-delta-gray"
                  @click="seleccionarParaVista(recibo)"
                >
                  <p class="text-sm font-semibold text-delta-text">{{ recibo.User?.nombre || 'Sin nombre' }}</p>
                  <p class="text-xs text-gray-500">{{ recibo.User?.email || 'Sin email' }} | {{ recibo.fecha_pago }}</p>
                  <p class="mt-1 text-sm font-semibold text-green-700">${{ Number(recibo.monto).toFixed(2) }}</p>
                </button>
              </div>
            </article>
          </section>

          <section v-else-if="seccionActiva === 'gestionar-empleados'" id="gestionar-empleados" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 class="text-base font-semibold text-delta-text">Crear Usuario</h3>
                <p class="mt-1 text-sm text-gray-600">Puedes crear empleados o administradores.</p>

                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  <input
                    v-model="employeeForm.username"
                    type="text"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                    placeholder="Username (ej: m.rodriguez)"
                  />
                  <input
                    v-model="employeeForm.password"
                    type="password"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                    placeholder="Contraseña temporal"
                  />
                  <select
                    v-model="employeeForm.role"
                    class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                  >
                    <option value="empleado">Empleado</option>
                    <option value="admin">Administrador</option>
                  </select>

                  <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    {{ employeeForm.role === 'admin'
                      ? 'Se creará un usuario administrador (sin perfil de empleado).'
                      : 'Se creará usuario empleado y perfil laboral vinculado.' }}
                  </div>

                  <template v-if="employeeForm.role === 'empleado'">
                    <input
                      v-model="employeeForm.quickbooks_id"
                      type="text"
                      class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                      placeholder="QuickBooks ID exacto"
                    />
                    <input
                      v-model="employeeForm.position"
                      type="text"
                      class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                      placeholder="Cargo (opcional)"
                    />
                    <input
                      v-model="employeeForm.first_name"
                      type="text"
                      class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                      placeholder="Nombre"
                    />
                    <input
                      v-model="employeeForm.last_name"
                      type="text"
                      class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                      placeholder="Apellido"
                    />
                    <input
                      v-model.number="employeeForm.base_salary"
                      type="number"
                      min="0"
                      step="0.01"
                      class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue sm:col-span-2"
                      placeholder="Salario base (opcional)"
                    />
                  </template>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <DeltaButton :loading="creatingEmployee" @click="crearEmpleado">
                    {{ employeeForm.role === 'admin' ? 'Crear Administrador' : 'Crear Empleado' }}
                  </DeltaButton>
                  <DeltaButton variant="secondary" @click="limpiarFormularioEmpleado">Limpiar formulario</DeltaButton>
                </div>
              </article>

              <article class="rounded-xl border border-slate-200 bg-white p-4">
                <h3 class="text-base font-semibold text-delta-text">Buscar en Historial</h3>
                <p class="mt-1 text-sm text-gray-600">Filtra por nombre, QuickBooks ID o username.</p>

                <div class="mt-4 flex w-full gap-2">
                  <input
                    v-model="search"
                    type="search"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                    placeholder="Buscar por nombre, QuickBooks ID o username"
                    @keyup.enter="buscarRecibos"
                  />
                  <DeltaButton :loading="loadingSearch" variant="secondary" @click="buscarRecibos">Buscar</DeltaButton>
                </div>
              </article>
            </div>

            <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-delta-text">Gestionar Empleados</h2>
                <p class="text-sm text-gray-600">Administra altas y revisa pagos de cada colaborador.</p>
              </div>
            </div>
          </section>

          <section v-else-if="seccionActiva === 'historial-pagos'" id="historial-pagos" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-delta-text">Historial de Pagos</h2>
                <p class="text-sm text-gray-600">Consulta y abre recibos importados previamente.</p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {{ recibosExistentes.length }} registros
              </span>
            </div>

            <div v-if="loadingSearch" class="mt-4 rounded-lg bg-delta-gray p-3 text-sm text-gray-600">Consultando recibos...</div>

            <div v-else class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="recibo in recibosExistentes"
                :key="`existente-${recibo.id}`"
                type="button"
                class="rounded-xl border border-gray-200 p-3 text-left transition hover:border-delta-blue/30 hover:bg-delta-gray"
                @click="seleccionarParaVista(recibo)"
              >
                <p class="text-sm font-semibold text-delta-text">{{ recibo.User?.nombre || 'Empleado' }}</p>
                <p class="text-xs text-gray-500">{{ recibo.User?.email || 'Sin email' }}</p>
                <p class="text-xs text-gray-500">{{ recibo.fecha_pago }} | {{ recibo.periodo }}</p>
                <p class="mt-1 text-sm font-semibold text-green-700">${{ Number(recibo.monto).toFixed(2) }}</p>
              </button>

              <p
                v-if="!recibosExistentes.length"
                class="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 sm:col-span-2 lg:col-span-3"
              >
                No hay recibos para mostrar con ese filtro.
              </p>
            </div>

            <section v-if="reciboSeleccionado" class="mt-5">
              <ReciboDetalle :recibo="reciboSeleccionado" @back="limpiarSeleccion" @print="imprimirVista" />
            </section>
          </section>

          <section v-else id="configuracion" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-semibold text-delta-text">Configuración</h2>
            <p class="mt-2 text-sm text-gray-600">Acciones de mantenimiento para la sesión de administración.</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <DeltaButton variant="secondary" @click="limpiarEntrada">Limpiar entrada y vista previa</DeltaButton>
              <DeltaButton variant="secondary" @click="limpiarMensajes">Limpiar mensajes</DeltaButton>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref } from 'vue'
import DeltaButton from '../components/common/DeltaButton.vue'
import DeltaLogo from '../components/common/DeltaLogo.vue'
import ReciboDetalle from '../components/payroll/ReciboDetalle.vue'
import { createEmployeeAdmin } from '../api/admin'
import { useAdminPayroll } from '../composables/useAdminPayroll'
import { useAuth } from '../composables/useAuth'
import type { Recibo } from '../types/payroll'

type AdminSection = 'cargar-nomina' | 'gestionar-empleados' | 'historial-pagos' | 'configuracion'

const { logout } = useAuth()

const {
  rawInput,
  selectedExcelFile,
  defaultEmployeeName,
  defaultEmployeeQuickbooksId,
  search,
  previewRecibos,
  recibosExistentes,
  reciboSeleccionado,
  loadingPreview,
  loadingImport,
  loadingSearch,
  errorMessage,
  successMessage,
  validItems,
  generarPreview,
  importarNomina,
  cargarRecibosAdmin,
  seleccionarRecibo,
  limpiarEntrada,
  limpiarMensajes,
  setExcelFile,
} = useAdminPayroll()

const creatingEmployee = ref(false)
const seccionActiva = ref<AdminSection>('cargar-nomina')
const employeeForm = ref({
  username: '',
  password: '',
  role: 'empleado' as 'admin' | 'empleado',
  quickbooks_id: '',
  first_name: '',
  last_name: '',
  position: '',
  base_salary: undefined as number | undefined,
})

onMounted(async () => {
  await cargarRecibosAdmin()
})

const limpiarFormularioEmpleado = () => {
  employeeForm.value = {
    username: '',
    password: '',
    role: 'empleado',
    quickbooks_id: '',
    first_name: '',
    last_name: '',
    position: '',
    base_salary: undefined,
  }
}

const cambiarSeccion = (seccion: AdminSection) => {
  seccionActiva.value = seccion

  if (seccion === 'historial-pagos') {
    void cargarRecibosAdmin(search.value)
  }
}

const crearEmpleado = async () => {
  limpiarMensajes()

  const payload = {
    username: employeeForm.value.username.trim(),
    password: employeeForm.value.password,
    role: employeeForm.value.role,
    quickbooks_id:
      employeeForm.value.role === 'empleado'
        ? employeeForm.value.quickbooks_id.trim()
        : undefined,
    first_name:
      employeeForm.value.role === 'empleado'
        ? employeeForm.value.first_name.trim()
        : undefined,
    last_name:
      employeeForm.value.role === 'empleado'
        ? employeeForm.value.last_name.trim()
        : undefined,
    position:
      employeeForm.value.role === 'empleado'
        ? employeeForm.value.position.trim() || undefined
        : undefined,
    base_salary:
      employeeForm.value.role === 'empleado'
        ? employeeForm.value.base_salary
        : undefined,
  }

  if (!payload.username || !payload.password) {
    errorMessage.value = 'Completa username y password.'
    return
  }

  if (
    payload.role === 'empleado' &&
    (!payload.quickbooks_id || !payload.first_name || !payload.last_name)
  ) {
    errorMessage.value =
      'Para empleado debes completar quickbooks_id, first_name y last_name.'
    return
  }

  creatingEmployee.value = true

  try {
    const response = await createEmployeeAdmin(payload)
    successMessage.value = response.message
    limpiarFormularioEmpleado()
    await cargarRecibosAdmin(search.value)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage = error.response?.data?.message
      errorMessage.value =
        typeof apiMessage === 'string' && apiMessage.trim()
          ? apiMessage
          : 'No fue posible crear el usuario.'
    } else {
      errorMessage.value = 'No fue posible crear el usuario.'
    }
  } finally {
    creatingEmployee.value = false
  }
}

const generarYSeleccionarPreview = () => {
  generarPreview()

  if (previewRecibos.value.length) {
    seleccionarRecibo(previewRecibos.value[0])
  }
}

const importarSemana = async () => {
  const importado = await importarNomina()

  if (!importado) {
    return
  }

  rawInput.value = ''
  await cargarRecibosAdmin(search.value)
}

const buscarRecibos = async () => {
  limpiarMensajes()
  await cargarRecibosAdmin(search.value)
}

const seleccionarParaVista = (recibo: Recibo) => {
  seleccionarRecibo(recibo)
}

const limpiarSeleccion = () => {
  seleccionarRecibo(null)
}

const imprimirVista = () => {
  window.print()
}

const onExcelFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  setExcelFile(file)
}
</script>
