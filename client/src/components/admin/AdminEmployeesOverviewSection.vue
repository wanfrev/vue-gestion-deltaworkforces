<template>
  <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 class="text-lg font-semibold text-delta-text">Manage Employees</h2>
      <p class="text-sm text-gray-600">Create users and review each employee's payment records.</p>
    </div>
    <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      {{ empleadosFiltradosCount }} employees
    </span>
  </div>

  <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Employees</p>
      <p class="mt-2 text-2xl font-bold text-slate-900">{{ empleadosConRegistrosCount }}</p>
      <p class="mt-1 text-xs text-slate-500">With payroll records</p>
    </article>

    <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Payroll</p>
      <p class="mt-2 text-2xl font-bold text-slate-900">{{ fechaUltimaNominaLabel }}</p>
      <p class="mt-1 text-xs text-slate-500">Last processed import</p>
    </article>

    <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Monthly Payout</p>
      <p class="mt-2 font-mono text-2xl font-bold text-slate-900">{{ totalPayoutMensualLabel }}</p>
      <p class="mt-1 text-xs text-slate-500">Current reference month</p>
    </article>

    <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">QuickBooks Sync</p>
      <div class="mt-2 flex items-center gap-2">
        <span class="inline-block h-2.5 w-2.5 rounded-full" :class="quickbooksSyncStats.ok ? 'bg-emerald-500' : 'bg-amber-500'"></span>
        <p class="text-sm font-semibold" :class="quickbooksSyncStats.ok ? 'text-emerald-700' : 'text-amber-700'">
          {{ quickbooksSyncStats.ok ? 'Mapping OK' : 'Pending' }}
        </p>
      </div>
      <p class="mt-1 text-xs text-slate-500">{{ quickbooksSyncStats.mapped }}/{{ quickbooksSyncStats.total }} with QuickBooks ID</p>
    </article>
  </div>

  <article class="mt-4 rounded-xl border border-slate-200 bg-white p-4" @click="emit('close-menu')">
    <h3 class="text-base font-semibold text-delta-text">Employee Directory</h3>
    <p class="mt-1 text-sm text-gray-600">Search employees by name, QuickBooks ID, or username.</p>

    <div class="mt-4 flex w-full flex-col gap-2 sm:flex-row">
      <input
        :value="search"
        type="search"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
        placeholder="Search employee by name, QuickBooks ID, or username"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('search')"
      />
      <DeltaButton class="sm:shrink-0" :loading="loadingSearch" variant="secondary" @click="emit('search')">Search</DeltaButton>
    </div>

    <div class="mt-4 rounded-xl border border-slate-200 bg-white">
      <div class="hidden grid-cols-[1.8fr_1fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <p>Employee</p>
        <p class="text-right">Actions</p>
      </div>

      <div v-if="empleadosDataGrid.length" class="divide-y divide-slate-100 bg-white">
        <div
          v-for="empleado in empleadosDataGrid"
          :key="`empleado-grid-${empleado.employeeId}`"
          class="grid gap-3 px-4 py-5 transition hover:bg-slate-50 md:grid-cols-[1.8fr_1fr_auto] md:items-center"
        >
          <div class="flex items-center gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {{ empleado.initials }}
            </span>
            <div>
              <p class="text-sm font-semibold leading-relaxed text-slate-900">{{ empleado.nombre }}</p>
              <p class="text-xs leading-relaxed text-slate-500">{{ empleado.username || 'No username' }}</p>
            </div>
          </div>

          <div class="relative flex items-center justify-start md:justify-end">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-delta-blue/40 hover:text-delta-blue"
              aria-label="Employee actions"
              @click.stop="emit('toggle-menu', empleado.employeeId)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            <div
              v-if="menuEmpleadoAbiertoId === empleado.employeeId"
              class="absolute left-0 top-full z-20 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg md:left-auto md:right-0"
              @click.stop
            >
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                @click="emit('open-history', empleado.employeeId)"
              >
                View history
              </button>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="deletingEmployeeId === empleado.employeeId"
                @click="emit('change-password', empleado)"
              >
                Change password
              </button>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="deletingEmployeeId === empleado.employeeId"
                @click="emit('delete-records', empleado)"
              >
                {{ deletingEmployeeId === empleado.employeeId ? 'Deleting...' : 'Delete records' }}
              </button>
              <button
                type="button"
                class="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="deletingEmployeeId === empleado.employeeId"
                @click="emit('delete-employee', empleado)"
              >
                {{ deletingEmployeeId === empleado.employeeId ? 'Deleting...' : 'Delete employee' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="p-6">
        <div v-if="!empleadosConRegistrosCount" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Users class="mx-auto h-7 w-7 text-slate-400" :size="28" :stroke-width="1.6" />
          <p class="mt-3 text-sm font-semibold text-slate-700">No employees yet.</p>
          <p class="mt-1 text-sm leading-relaxed text-slate-500">Create your first employee to start managing payroll.</p>
        </div>
        <p
          v-else
          class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-gray-500"
        >
          No employees with records matched this filter.
        </p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Users } from 'lucide-vue-next'
import DeltaButton from '../common/DeltaButton.vue'

interface EmpleadoGridItem {
  employeeId: number
  nombre: string
  username: string
  initials: string
  registros: number
}

defineProps<{
  search: string
  loadingSearch: boolean
  empleadosFiltradosCount: number
  empleadosConRegistrosCount: number
  fechaUltimaNominaLabel: string
  totalPayoutMensualLabel: string
  quickbooksSyncStats: {
    ok: boolean
    mapped: number
    total: number
  }
  empleadosDataGrid: EmpleadoGridItem[]
  menuEmpleadoAbiertoId: number | null
  deletingEmployeeId: number | null
}>()

const emit = defineEmits<{
  (event: 'update:search', value: string): void
  (event: 'search'): void
  (event: 'close-menu'): void
  (event: 'toggle-menu', employeeId: number): void
  (event: 'open-history', employeeId: number): void
  (event: 'change-password', empleado: EmpleadoGridItem): void
  (event: 'delete-records', empleado: EmpleadoGridItem): void
  (event: 'delete-employee', empleado: EmpleadoGridItem): void
}>()
</script>
