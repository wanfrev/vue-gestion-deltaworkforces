<template>
  <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <h3 class="text-base font-semibold text-delta-text">Create User</h3>
    <p class="mt-1 text-sm text-gray-600">You can create employee or admin users. Superadmin can also create superadmin users.</p>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <select
        :value="employeeForm.role"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
        @change="updateRole($event)"
      >
        <option value="empleado">Employee</option>
        <option value="admin">Admin</option>
        <option v-if="canCreateSuperadmin" value="superadmin">Superadmin</option>
      </select>

      <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        {{ employeeForm.role === 'admin'
            ? 'An admin user will be created (no employee profile).'
            : employeeForm.role === 'superadmin'
              ? 'A superadmin user will be created (full admin control).'
            : 'An employee user with linked profile will be created.' }}
      </div>

      <input
        :value="employeeForm.username"
        type="text"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
        placeholder="Username (e.g. m.rodriguez)"
        @input="updateField('username', ($event.target as HTMLInputElement).value)"
      />
      <input
        :value="employeeForm.password"
        type="password"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
        placeholder="Temporary password"
        @input="updateField('password', ($event.target as HTMLInputElement).value)"
      />

      <template v-if="employeeForm.role === 'empleado'">
        <input
          :value="employeeForm.quickbooks_id"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
          placeholder="Exact QuickBooks ID"
          @input="updateField('quickbooks_id', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="employeeForm.position"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
          placeholder="Position (optional)"
          @input="updateField('position', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="employeeForm.first_name"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
          placeholder="First name"
          @input="updateField('first_name', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="employeeForm.last_name"
          type="text"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
          placeholder="Last name"
          @input="updateField('last_name', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="employeeForm.base_salary ?? ''"
          type="number"
          min="0"
          step="0.01"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue sm:col-span-2"
          placeholder="Base salary (optional)"
          @input="onBaseSalaryInput"
        />
      </template>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <DeltaButton :loading="creatingEmployee" @click="emit('create-user')">
        {{ employeeForm.role === 'superadmin' ? 'Create Superadmin' : employeeForm.role === 'admin' ? 'Create Admin' : 'Create Employee' }}
      </DeltaButton>
      <DeltaButton variant="secondary" @click="emit('clear-form')">Clear form</DeltaButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import DeltaButton from '../common/DeltaButton.vue'

interface EmployeeFormState {
  username: string
  password: string
  role: 'superadmin' | 'admin' | 'empleado'
  quickbooks_id: string
  first_name: string
  last_name: string
  position: string
  base_salary: number | undefined
}

const props = defineProps<{
  employeeForm: EmployeeFormState
  creatingEmployee: boolean
  canCreateSuperadmin: boolean
}>()

const emit = defineEmits<{
  (event: 'update:employeeForm', value: EmployeeFormState): void
  (event: 'create-user'): void
  (event: 'clear-form'): void
}>()

const updateField = <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => {
  emit('update:employeeForm', {
    ...props.employeeForm,
    [field]: value,
  })
}

const updateRole = (event: Event) => {
  const role = (event.target as HTMLSelectElement).value as EmployeeFormState['role']
  updateField('role', role)
}

const onBaseSalaryInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value
  updateField('base_salary', raw.trim() ? Number(raw) : undefined)
}
</script>
