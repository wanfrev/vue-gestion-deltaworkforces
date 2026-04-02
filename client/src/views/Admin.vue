<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
      <aside class="w-full border-b border-slate-800 bg-slate-900 text-slate-100 md:w-72 md:border-r md:border-b-0">
        <div class="sticky top-0 px-5 py-6 md:px-6">
          <div class="mb-6 flex items-center gap-3">
            <DeltaLogo size="lg" />
          </div>

          <nav class="space-y-2 text-sm">
            <a href="#cargar-nomina" class="block rounded-lg border border-transparent bg-slate-800/60 px-3 py-2 font-medium text-slate-100 transition hover:border-blue-500/40 hover:bg-slate-800">Cargar Nómina</a>
            <a href="#gestionar-empleados" class="block rounded-lg border border-transparent px-3 py-2 font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100">Gestionar Empleados</a>
            <a href="#historial-pagos" class="block rounded-lg border border-transparent px-3 py-2 font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100">Historial de Pagos</a>
            <a href="#configuracion" class="block rounded-lg border border-transparent px-3 py-2 font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-slate-800 hover:text-slate-100">Configuración</a>
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

          <section id="cargar-nomina" class="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
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
                    v-model="defaultEmployeeEmail"
                    type="email"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                    placeholder="Email por defecto (opcional)"
                  />
                </div>
              </div>

              <textarea
                v-model="rawInput"
                :disabled="Boolean(selectedExcelFile)"
                class="mt-4 min-h-56 w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-700 outline-none transition focus:border-delta-blue"
                placeholder="Ejemplo encabezados: email, nombre, fecha_pago, total_neto, horas_regulares, pago_hora, deducciones, bonos, cargo"
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

          <section id="gestionar-empleados" class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-delta-text">Gestionar Empleados</h2>
                <p class="text-sm text-gray-600">Filtra por nombre o email para revisar recibos de cada colaborador.</p>
              </div>

              <div class="flex w-full gap-2 lg:w-auto">
                <input
                  v-model="search"
                  type="search"
                  class="w-full min-w-60 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
                  placeholder="Buscar por nombre o email"
                  @keyup.enter="buscarRecibos"
                />
                <DeltaButton :loading="loadingSearch" variant="secondary" @click="buscarRecibos">Buscar</DeltaButton>
              </div>
            </div>
          </section>

          <section id="historial-pagos" class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
          </section>

          <section id="configuracion" class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-semibold text-delta-text">Configuración</h2>
            <p class="mt-2 text-sm text-gray-600">Acciones de mantenimiento para la sesión de administración.</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <DeltaButton variant="secondary" @click="limpiarEntrada">Limpiar entrada y vista previa</DeltaButton>
              <DeltaButton variant="secondary" @click="limpiarMensajes">Limpiar mensajes</DeltaButton>
            </div>
          </section>

          <section v-if="reciboSeleccionado" class="mt-5">
            <ReciboDetalle :recibo="reciboSeleccionado" @back="limpiarSeleccion" @print="imprimirVista" />
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DeltaButton from '../components/common/DeltaButton.vue'
import DeltaLogo from '../components/common/DeltaLogo.vue'
import ReciboDetalle from '../components/payroll/ReciboDetalle.vue'
import { useAdminPayroll } from '../composables/useAdminPayroll'
import { useAuth } from '../composables/useAuth'
import type { Recibo } from '../types/payroll'

const { logout } = useAuth()

const {
  rawInput,
  selectedExcelFile,
  defaultEmployeeName,
  defaultEmployeeEmail,
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

onMounted(async () => {
  await cargarRecibosAdmin()
})

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
