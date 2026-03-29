<template>
  <div class="min-h-screen bg-delta-gray p-4 sm:p-6">
    <div class="mx-auto max-w-6xl">
      <AppHeader
        title="Oficina de Nómina"
        subtitle="Importa datos desde QuickBooks/Excel, previsualiza y publica recibos."
        @logout="logout"
      />

      <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>
      <p
        v-if="successMessage"
        class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
      >
        {{ successMessage }}
      </p>

      <section class="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 class="text-lg font-semibold text-delta-text">Importar Nómina de la Semana</h2>
          <p class="mt-2 text-sm text-gray-600">
            Pega texto exportado desde Excel o QuickBooks. Acepta CSV, TSV o JSON.
          </p>

          <textarea
            v-model="rawInput"
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

          <div class="mt-4 rounded-lg bg-delta-gray p-3 text-xs text-gray-600">
            Registros en preview: {{ previewRecibos.length }} | Válidos para importar: {{ validItems.length }}
          </div>
        </article>

        <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
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

      <section class="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-delta-text">Buscador de empleados</h2>
            <p class="text-sm text-gray-600">Consulta recibos ya importados y abre una vista previa.</p>
          </div>

          <div class="flex w-full gap-2 sm:w-auto">
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

      <section v-if="reciboSeleccionado" class="mt-5">
        <ReciboDetalle :recibo="reciboSeleccionado" @back="limpiarSeleccion" @print="imprimirVista" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import DeltaButton from '../components/common/DeltaButton.vue'
import ReciboDetalle from '../components/payroll/ReciboDetalle.vue'
import { useAdminPayroll } from '../composables/useAdminPayroll'
import { useAuth } from '../composables/useAuth'
import type { Recibo } from '../types/payroll'

const { logout } = useAuth()

const {
  rawInput,
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
</script>
