<template>
  <div class="min-h-screen bg-slate-900">
    <div class="flex min-h-screen flex-col md:flex-row">
      <aside class="w-full border-b border-slate-800/70 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 md:w-80 md:border-r md:border-b-0 md:border-r-slate-800/70">
        <div class="sticky top-0 px-5 py-6 md:px-6">
          <div class="mb-6 flex justify-center">
            <DeltaLogo size="xl" centered />
          </div>

          <nav class="space-y-1.5 text-sm">
            <button
              type="button"
              class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
              :class="seccionActiva === 'cargar-nomina'
                ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
              @click="cambiarSeccion('cargar-nomina')"
            >
              <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'cargar-nomina' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
              <Upload :size="16" :stroke-width="1.75" :class="seccionActiva === 'cargar-nomina' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
              <span>Cargar Nómina</span>
            </button>
            <button
              type="button"
              class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
              :class="seccionActiva === 'gestionar-empleados'
                ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
              @click="cambiarSeccion('gestionar-empleados')"
            >
              <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'gestionar-empleados' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
              <Users :size="16" :stroke-width="1.75" :class="seccionActiva === 'gestionar-empleados' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
              <span>Gestionar Empleados</span>
            </button>
            <button
              type="button"
              class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
              :class="seccionActiva === 'historial-pagos'
                ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
              @click="cambiarSeccion('historial-pagos')"
            >
              <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'historial-pagos' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
              <History :size="16" :stroke-width="1.75" :class="seccionActiva === 'historial-pagos' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
              <span>Historial de Pagos</span>
            </button>
            <button
              type="button"
              class="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left font-medium transition"
              :class="seccionActiva === 'configuracion'
                ? 'border-slate-700 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-800/60 hover:text-slate-100'"
              @click="cambiarSeccion('configuracion')"
            >
              <span class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full transition" :class="seccionActiva === 'configuracion' ? 'bg-cyan-400' : 'bg-transparent group-hover:bg-slate-600/60'"></span>
              <Settings :size="16" :stroke-width="1.75" :class="seccionActiva === 'configuracion' ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-100'" />
              <span>Configuración</span>
            </button>
          </nav>

          <div class="mt-6 rounded-2xl border border-slate-700/80 bg-slate-800/45 p-3 text-xs text-slate-300 backdrop-blur-xl">
            <p class="font-semibold text-slate-100">Resumen rápido</p>
            <p class="mt-2">Recibos cargados: {{ recibosExistentes.length }}</p>
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

          <section v-if="seccionActiva === 'cargar-nomina'" id="cargar-nomina">
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-semibold text-delta-text">Cargar Nómina</h2>
              <p class="mt-2 text-sm text-gray-600">
                Sube un archivo Excel (.xlsx) o pega texto exportado desde QuickBooks. Acepta CSV, TSV o JSON.
              </p>

              <div class="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-3">
                <label class="text-xs font-semibold uppercase tracking-wide text-gray-600">Archivo Excel</label>
                <input
                  ref="dropzoneInput"
                  type="file"
                  accept=".xlsx,.xls"
                  class="hidden"
                  @change="onExcelFileChange"
                />

                <div
                  role="button"
                  tabindex="0"
                  class="mt-2 rounded-xl border border-dashed px-4 py-5 text-center transition"
                  :class="isDropzoneHover
                    ? 'border-delta-blue bg-blue-50'
                    : 'border-slate-300 bg-white hover:border-delta-blue/60 hover:bg-slate-50'"
                  @click="onDropzoneClick"
                  @keydown.enter.prevent="onDropzoneClick"
                  @keydown.space.prevent="onDropzoneClick"
                  @dragover.prevent="onDropzoneDragOver"
                  @dragleave.prevent="onDropzoneDragLeave"
                  @drop.prevent="onDropzoneDrop"
                >
                  <Upload class="mx-auto h-5 w-5 text-slate-500" :size="20" :stroke-width="1.8" />
                  <p class="mt-2 text-sm font-medium text-slate-700">Arrastra y suelta el Excel aquí</p>
                  <p class="mt-1 text-xs text-slate-500">o haz clic para seleccionar (.xlsx, .xls)</p>

                  <p v-if="selectedExcelFile" class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    Archivo seleccionado: {{ selectedExcelFile.name }}
                  </p>
                </div>

                <div v-if="loadingImport" class="mt-3">
                  <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      class="h-full rounded-full bg-delta-blue transition-all duration-300"
                      :style="{ width: `${Math.max(importProgress, 8)}%` }"
                    ></div>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">Procesando importación... {{ importProgress }}%</p>
                </div>

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
                <DeltaButton :loading="loadingImport" @click="importarSemana">Importar Nómina de la Semana</DeltaButton>
                <DeltaButton variant="secondary" @click="limpiarEntrada">Limpiar</DeltaButton>
              </div>
            </article>
          </section>

          <section v-else-if="seccionActiva === 'gestionar-empleados'" id="gestionar-empleados" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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

            <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-delta-text">Gestionar Empleados</h2>
                <p class="text-sm text-gray-600">Administra altas y revisa pagos de cada colaborador.</p>
              </div>
              <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {{ empleadosFiltrados.length }} empleados
              </span>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Employees</p>
                <p class="mt-2 text-2xl font-bold text-slate-900">{{ empleadosConRegistros.length }}</p>
                <p class="mt-1 text-xs text-slate-500">Con registros en nómina</p>
              </article>

              <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Payroll</p>
                <p class="mt-2 text-2xl font-bold text-slate-900">{{ fechaUltimaNominaLabel }}</p>
                <p class="mt-1 text-xs text-slate-500">Última importación procesada</p>
              </article>

              <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Monthly Payout</p>
                <p class="mt-2 font-mono text-2xl font-bold text-slate-900">{{ formatMoney(totalPayoutMensual) }}</p>
                <p class="mt-1 text-xs text-slate-500">Mes actual de referencia</p>
              </article>

              <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">QuickBooks Sync</p>
                <div class="mt-2 flex items-center gap-2">
                  <span class="inline-block h-2.5 w-2.5 rounded-full" :class="quickbooksSyncStats.ok ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                  <p class="text-sm font-semibold" :class="quickbooksSyncStats.ok ? 'text-emerald-700' : 'text-amber-700'">
                    {{ quickbooksSyncStats.ok ? 'Mapeo OK' : 'Pendiente' }}
                  </p>
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ quickbooksSyncStats.mapped }}/{{ quickbooksSyncStats.total }} con QuickBooks ID</p>
              </article>
            </div>

            <div class="mt-4 grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
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

              <article class="rounded-xl border border-slate-200 bg-white p-4" @click="cerrarMenuEmpleado">
                <h3 class="text-base font-semibold text-delta-text">Employee Directory</h3>
                <p class="mt-1 text-sm text-gray-600">Vista operativa con estado, salario base y acciones por empleado.</p>

                <div class="mt-4 rounded-xl border border-slate-200 bg-white">
                  <div class="hidden grid-cols-[1.8fr_1fr_0.9fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                    <p>Empleado</p>
                    <p class="text-right">Base Salary</p>
                    <p>Status</p>
                    <p class="text-right">Acciones</p>
                  </div>

                  <div v-if="empleadosDataGrid.length" class="divide-y divide-slate-100 bg-white">
                    <div
                      v-for="empleado in empleadosDataGrid"
                      :key="`empleado-grid-${empleado.employeeId}`"
                      class="grid gap-3 px-4 py-5 transition hover:bg-slate-50 md:grid-cols-[1.8fr_1fr_0.9fr_auto] md:items-center"
                    >
                      <div class="flex items-center gap-3">
                        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {{ empleado.initials }}
                        </span>
                        <div>
                          <p class="text-sm font-semibold leading-relaxed text-slate-900">{{ empleado.nombre }}</p>
                          <p class="text-xs leading-relaxed text-slate-500">{{ empleado.username || 'Sin username' }}</p>
                        </div>
                      </div>

                      <p class="text-left font-mono text-sm font-semibold leading-relaxed text-slate-800 md:text-right">
                        {{ empleado.baseSalary === null ? 'N/D' : formatMoney(empleado.baseSalary) }}
                      </p>

                      <div>
                        <span
                          class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                          :class="empleado.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
                        >
                          {{ empleado.status === 'active' ? 'Active' : 'Inactive' }}
                        </span>
                      </div>

                      <div class="relative flex items-center justify-start md:justify-end">
                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-delta-blue/40 hover:text-delta-blue"
                          aria-label="Acciones de empleado"
                          @click.stop="alternarMenuEmpleado(empleado.employeeId)"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>

                        <div
                          v-if="menuEmpleadoAbiertoId === empleado.employeeId"
                          class="absolute right-0 top-full z-20 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                          @click.stop
                        >
                          <button
                            type="button"
                            class="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                            @click="abrirHistorialEmpleado(empleado.employeeId)"
                          >
                            Ver historial
                          </button>
                          <button
                            type="button"
                            class="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="deletingEmployeeId === empleado.employeeId"
                            @click="eliminarRegistrosDesdeMenu(empleado)"
                          >
                            {{ deletingEmployeeId === empleado.employeeId ? 'Eliminando...' : 'Borrar registros' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="p-6">
                    <div v-if="!empleadosConRegistros.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <Users class="mx-auto h-7 w-7 text-slate-400" :size="28" :stroke-width="1.6" />
                      <p class="mt-3 text-sm font-semibold text-slate-700">Parece que aun no hay empleados.</p>
                      <p class="mt-1 text-sm leading-relaxed text-slate-500">Comienza creando el primero para gestionar su nomina.</p>
                    </div>
                    <p
                      v-else
                      class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-gray-500"
                    >
                      No se encontraron empleados con registros para ese filtro.
                    </p>
                  </div>
                </div>
              </article>
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

            <div v-else class="mt-4 space-y-3">
              <article
                v-for="empleado in historialAgrupadoPorEmpleado"
                :key="empleado.key"
                class="rounded-xl border border-slate-200 bg-white p-4"
              >
                <button
                  type="button"
                  class="flex w-full items-start justify-between gap-3 text-left"
                  @click="alternarEmpleadoHistorial(empleado.key)"
                >
                  <div>
                    <p class="text-sm font-semibold text-delta-text">{{ empleado.nombre }}</p>
                    <p class="mt-1 text-xs text-gray-500">
                      {{ empleado.username || 'Sin username' }}
                      <span v-if="empleado.quickbooksId">| {{ empleado.quickbooksId }}</span>
                    </p>
                  </div>

                  <div class="text-right">
                    <p class="text-xs text-slate-600">{{ empleado.pagos.length }} pagos</p>
                    <p class="text-xs font-medium text-green-700">${{ empleado.montoTotal.toFixed(2) }}</p>
                  </div>
                </button>

                <div v-if="empleadoHistorialAbierto === empleado.key" class="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <article
                    v-for="recibo in empleado.pagos"
                    :key="`existente-${recibo.id}`"
                    class="rounded-xl border border-gray-200 bg-white transition hover:border-delta-blue/30"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left hover:bg-delta-gray"
                      @click="alternarReciboHistorial(recibo, empleado.key)"
                    >
                      <div>
                        <p class="text-sm font-semibold text-delta-text">{{ recibo.fecha_pago }}</p>
                        <p class="text-xs text-gray-500">{{ recibo.periodo }}</p>
                      </div>
                      <p class="text-sm font-semibold text-green-700">${{ Number(recibo.monto).toFixed(2) }}</p>
                    </button>

                    <section v-if="reciboSeleccionado?.id === recibo.id" class="border-t border-slate-100 p-3">
                      <ReciboDetalle :recibo="reciboSeleccionado" @back="cerrarReciboActivo" @print="imprimirVista" />
                    </section>
                  </article>
                </div>
              </article>

              <p
                v-if="!historialAgrupadoPorEmpleado.length"
                class="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500"
              >
                No hay recibos para mostrar con ese filtro.
              </p>
            </div>
          </section>

          <section v-else id="configuracion" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-lg font-semibold text-delta-text">Configuración</h2>
            <p class="mt-2 text-sm text-gray-600">Acciones de mantenimiento para la sesión de administración.</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <DeltaButton variant="secondary" @click="limpiarEntrada">Limpiar entrada</DeltaButton>
              <DeltaButton variant="secondary" @click="limpiarMensajes">Limpiar mensajes</DeltaButton>
            </div>
          </section>
        </div>
      </main>

      <div
        v-if="toast.visible"
        class="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Importación completada</p>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ toast.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { History, Settings, Upload, Users } from 'lucide-vue-next'
import DeltaButton from '../components/common/DeltaButton.vue'
import DeltaLogo from '../components/common/DeltaLogo.vue'
import ReciboDetalle from '../components/payroll/ReciboDetalle.vue'
import { createEmployeeAdmin, deleteEmployeePaymentRecordsAdmin } from '../api/admin'
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
  recibosExistentes,
  reciboSeleccionado,
  loadingImport,
  importProgress,
  loadingSearch,
  errorMessage,
  successMessage,
  importarNomina,
  cargarRecibosAdmin,
  seleccionarRecibo,
  limpiarEntrada,
  limpiarMensajes,
  setExcelFile,
} = useAdminPayroll()

const creatingEmployee = ref(false)
const deletingEmployeeId = ref<number | null>(null)
const empleadoHistorialAbierto = ref<string | null>(null)
const menuEmpleadoAbiertoId = ref<number | null>(null)
const dropzoneInput = ref<HTMLInputElement | null>(null)
const isDropzoneHover = ref(false)
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

const toast = ref({
  visible: false,
  message: '',
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

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
})

onMounted(async () => {
  await cargarRecibosAdmin('', 200)
})

const empleadosConRegistros = computed(() => {
  const grouped = new Map<
    number,
    {
      employeeId: number
      nombre: string
      quickbooksId: string
      username: string
      registros: number
      montoTotal: number
    }
  >()

  for (const recibo of recibosExistentes.value) {
    const employeeId = Number(recibo.employeeId || 0)

    if (!employeeId) {
      continue
    }

    const current = grouped.get(employeeId)

    if (!current) {
      grouped.set(employeeId, {
        employeeId,
        nombre: String(recibo.User?.nombre || recibo.empleadoNombre || 'Empleado').trim(),
        quickbooksId: String(recibo.quickbooksId || recibo.detalles?.quickbooks_id || '').trim(),
        username: String(recibo.User?.email || recibo.empleadoEmail || '').trim(),
        registros: 1,
        montoTotal: Number(recibo.monto || 0),
      })
      continue
    }

    current.registros += 1
    current.montoTotal += Number(recibo.monto || 0)
  }

  return Array.from(grouped.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const normalizeSearchText = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

const parseIsoDate = (value?: string): Date | null => {
  if (!value) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

const getInitials = (name: string): string => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return initials || '--'
}

const levenshteinDistance = (left: string, right: string): number => {
  if (left === right) {
    return 0
  }

  if (!left.length) {
    return right.length
  }

  if (!right.length) {
    return left.length
  }

  const matrix: number[][] = Array.from({ length: left.length + 1 }, () => [])

  for (let i = 0; i <= left.length; i += 1) {
    matrix[i][0] = i
  }

  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[left.length][right.length]
}

const empleadosFiltrados = computed(() => {
  const query = normalizeSearchText(search.value)

  if (!query) {
    return empleadosConRegistros.value
  }

  return empleadosConRegistros.value.filter((empleado) => {
    const searchable = normalizeSearchText(
      [empleado.nombre, empleado.quickbooksId, empleado.username].filter(Boolean).join(' '),
    )

    if (searchable.includes(query)) {
      return true
    }

    return searchable
      .split(/\s+/)
      .filter(Boolean)
      .some((token) => token.includes(query) || levenshteinDistance(token, query) <= 2)
  })
})

const fechaNominaReciente = computed(() => {
  let latest: Date | null = null

  for (const recibo of recibosExistentes.value) {
    const candidate = parseIsoDate(recibo.fecha_pago)

    if (!candidate) {
      continue
    }

    if (!latest || candidate > latest) {
      latest = candidate
    }
  }

  return latest
})

const fechaUltimaNominaLabel = computed(() => {
  if (!fechaNominaReciente.value) {
    return 'Sin datos'
  }

  return fechaNominaReciente.value.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})

const totalPayoutMensual = computed(() => {
  const anchor = fechaNominaReciente.value

  if (!anchor) {
    return 0
  }

  const month = anchor.getMonth()
  const year = anchor.getFullYear()

  return recibosExistentes.value
    .filter((recibo) => {
      const date = parseIsoDate(recibo.fecha_pago)
      return Boolean(date) && date!.getMonth() === month && date!.getFullYear() === year
    })
    .reduce((sum, recibo) => sum + Number(recibo.monto || 0), 0)
})

const quickbooksSyncStats = computed(() => {
  const total = empleadosConRegistros.value.length
  const mapped = empleadosConRegistros.value.filter((empleado) => Boolean(empleado.quickbooksId)).length

  return {
    total,
    mapped,
    pending: Math.max(total - mapped, 0),
    ok: total > 0 && mapped === total,
  }
})

const empleadosDataGrid = computed(() => {
  const latestByEmployee = new Map<number, Recibo>()

  for (const recibo of recibosExistentes.value) {
    const employeeId = Number(recibo.employeeId || 0)

    if (!employeeId) {
      continue
    }

    const current = latestByEmployee.get(employeeId)
    const currentDate = parseIsoDate(current?.fecha_pago)
    const nextDate = parseIsoDate(recibo.fecha_pago)

    if (!current || (nextDate && (!currentDate || nextDate > currentDate))) {
      latestByEmployee.set(employeeId, recibo)
    }
  }

  const anchor = fechaNominaReciente.value

  return empleadosFiltrados.value.map((empleado) => {
    const ultimoRecibo = latestByEmployee.get(empleado.employeeId)
    const fechaUltimoPago = parseIsoDate(ultimoRecibo?.fecha_pago)
    const diasSinPago =
      anchor && fechaUltimoPago
        ? Math.floor((anchor.getTime() - fechaUltimoPago.getTime()) / 86400000)
        : null
    const status = diasSinPago !== null && diasSinPago <= 45 ? 'active' : 'inactive'
    const baseSalaryRaw = ultimoRecibo?.detalles?.base_salary ?? ultimoRecibo?.detalles?.salario_base
    const baseSalaryParsed = Number(baseSalaryRaw)

    return {
      ...empleado,
      initials: getInitials(empleado.nombre),
      status,
      baseSalary: Number.isFinite(baseSalaryParsed) ? baseSalaryParsed : null,
    }
  })
})

const historialAgrupadoPorEmpleado = computed(() => {
  const grouped = new Map<
    string,
    {
      key: string
      nombre: string
      quickbooksId: string
      username: string
      pagos: Recibo[]
      montoTotal: number
    }
  >()

  for (const recibo of recibosExistentes.value) {
    const employeeId = recibo.employeeId ? String(recibo.employeeId) : ''
    const nombre = String(recibo.User?.nombre || recibo.empleadoNombre || 'Empleado').trim() || 'Empleado'
    const quickbooksId = String(recibo.quickbooksId || recibo.detalles?.quickbooks_id || '').trim()
    const username = String(recibo.User?.email || recibo.empleadoEmail || '').trim()
    const key = employeeId || `sin-id-${normalizeSearchText([nombre, quickbooksId, username].filter(Boolean).join('-')) || recibo.id}`

    const current = grouped.get(key)

    if (!current) {
      grouped.set(key, {
        key,
        nombre,
        quickbooksId,
        username,
        pagos: [recibo],
        montoTotal: Number(recibo.monto || 0),
      })
      continue
    }

    current.pagos.push(recibo)
    current.montoTotal += Number(recibo.monto || 0)
  }

  return Array.from(grouped.values())
    .map((empleado) => ({
      ...empleado,
      pagos: empleado.pagos.sort((left, right) => right.fecha_pago.localeCompare(left.fecha_pago)),
    }))
    .sort((left, right) => left.nombre.localeCompare(right.nombre))
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
    void cargarRecibosAdmin('', 200)
  }

  if (seccion === 'gestionar-empleados') {
    void cargarRecibosAdmin('', 200)
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
    await cargarRecibosAdmin('', 200)
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

const importarSemana = async () => {
  const importado = await importarNomina()

  if (!importado.ok) {
    return
  }

  const employeeName = importado.employeeName || 'empleado'
  const linkedText = importado.linkedRecords === 1 ? '1 registro' : `${importado.linkedRecords} registros`

  showToast(`${linkedText} vinculados a ${employeeName} correctamente.`)

  rawInput.value = ''

  if (dropzoneInput.value) {
    dropzoneInput.value.value = ''
  }

  await cargarRecibosAdmin('', 200)
}

const buscarRecibos = async () => {
  limpiarMensajes()
  await cargarRecibosAdmin('', 200)
}

const alternarMenuEmpleado = (employeeId: number) => {
  menuEmpleadoAbiertoId.value = menuEmpleadoAbiertoId.value === employeeId ? null : employeeId
}

const cerrarMenuEmpleado = () => {
  menuEmpleadoAbiertoId.value = null
}

const abrirHistorialEmpleado = (employeeId: number) => {
  const key = String(employeeId)
  const empleado = historialAgrupadoPorEmpleado.value.find((item) => item.key === key)

  seccionActiva.value = 'historial-pagos'
  empleadoHistorialAbierto.value = key
  seleccionarRecibo(empleado?.pagos?.[0] ?? null)
  cerrarMenuEmpleado()
}

const eliminarRegistrosDesdeMenu = async (empleado: { employeeId: number; nombre: string; registros: number }) => {
  cerrarMenuEmpleado()
  await borrarRegistrosEmpleado(empleado.employeeId, empleado.nombre, empleado.registros)
}

const borrarRegistrosEmpleado = async (employeeId: number, nombre: string, registros: number) => {
  const confirmado = window.confirm(
    `Se eliminarán ${registros} registro(s) de nómina de ${nombre}. Esta acción no se puede deshacer.`,
  )

  if (!confirmado) {
    return
  }

  deletingEmployeeId.value = employeeId

  try {
    const response = await deleteEmployeePaymentRecordsAdmin(employeeId)
    successMessage.value = `${response.msg} Eliminados: ${response.deletedCount}.`
    await cargarRecibosAdmin('', 200)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMsg = error.response?.data?.msg
      errorMessage.value =
        typeof apiMsg === 'string' && apiMsg.trim()
          ? apiMsg
          : 'No fue posible eliminar los registros del empleado.'
    } else {
      errorMessage.value = 'No fue posible eliminar los registros del empleado.'
    }
  } finally {
    deletingEmployeeId.value = null
  }
}

const seleccionarParaVista = (recibo: Recibo, employeeKey?: string) => {
  const key = employeeKey || (recibo.employeeId ? String(recibo.employeeId) : null)

  if (key) {
    empleadoHistorialAbierto.value = key
  }

  seleccionarRecibo(recibo)
}

const alternarReciboHistorial = (recibo: Recibo, employeeKey?: string) => {
  if (reciboSeleccionado.value?.id === recibo.id) {
    cerrarReciboActivo()
    return
  }

  seleccionarParaVista(recibo, employeeKey)
}

const alternarEmpleadoHistorial = (employeeKey: string) => {
  if (empleadoHistorialAbierto.value === employeeKey) {
    empleadoHistorialAbierto.value = null
    seleccionarRecibo(null)
    return
  }

  empleadoHistorialAbierto.value = employeeKey
  seleccionarRecibo(null)
}

const cerrarReciboActivo = () => {
  seleccionarRecibo(null)
}

const imprimirVista = () => {
  window.print()
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
    errorMessage.value = 'Solo se permiten archivos Excel (.xlsx o .xls).'
    return
  }

  setExcelFile(file)
}

const onDropzoneClick = () => {
  dropzoneInput.value?.click()
}

const onDropzoneDragOver = () => {
  isDropzoneHover.value = true
}

const onDropzoneDragLeave = () => {
  isDropzoneHover.value = false
}

const onDropzoneDrop = (event: DragEvent) => {
  isDropzoneHover.value = false
  const file = event.dataTransfer?.files?.[0] ?? null
  applyExcelFile(file)
}

const onExcelFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  applyExcelFile(file)
}
</script>
