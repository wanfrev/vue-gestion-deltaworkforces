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

      <!-- Username field with validation -->
      <div class="relative">
        <input
          :value="employeeForm.username"
          type="text"
          :class="['w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-delta-blue', usernameValid ? 'border-gray-300' : 'border-red-300 focus:border-red-400']"
          placeholder="Username (e.g. m.rodriguez)"
          @input="updateField('username', ($event.target as HTMLInputElement).value)"
        />
        <p class="mt-1 text-xs text-gray-500">
          <span :class="usernameLengthValid ? 'text-emerald-600' : 'text-gray-500'">✓</span> 3-50 characters
          <span class="mx-1">·</span>
          <span :class="usernameFormatValid ? 'text-emerald-600' : 'text-gray-500'">✓</span> letters, numbers, dots, hyphens
        </p>
      </div>

      <!-- Password field with validation -->
      <div class="relative">
        <input
          :value="employeeForm.password"
          type="password"
          :class="['w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-delta-blue', passwordValid ? 'border-gray-300' : 'border-red-300 focus:border-red-400']"
          placeholder="Temporary password"
          @input="updateField('password', ($event.target as HTMLInputElement).value)"
        />
        <p class="mt-1 text-xs text-gray-500">
          <span :class="passwordLengthValid ? 'text-emerald-600' : 'text-gray-500'">✓</span> Min 8 characters
          <span class="mx-1">·</span>
          Max 100 characters
        </p>
      </div>

      <template v-if="employeeForm.role === 'empleado'">
        <!-- QuickBooks ID - Required -->
        <div class="relative">
          <input
            :value="employeeForm.quickbooks_id"
            type="text"
            :class="['w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-delta-blue', quickbooksIdValid ? 'border-gray-300' : 'border-red-300 focus:border-red-400']"
            placeholder="Exact QuickBooks ID"
            @input="updateField('quickbooks_id', ($event.target as HTMLInputElement).value)"
          />
          <p class="mt-1 text-xs text-gray-500">
            <span :class="employeeForm.quickbooks_id.trim().length > 0 ? 'text-emerald-600' : 'text-red-500'">✓</span> Required · Exact ID from QuickBooks
          </p>
        </div>

        <!-- Position - Optional -->
        <div class="relative">
          <input
            :value="employeeForm.position"
            type="text"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
            placeholder="Position (optional)"
            @input="updateField('position', ($event.target as HTMLInputElement).value)"
          />
          <p class="mt-1 text-xs text-gray-500">Optional · Job title or role</p>
        </div>

        <!-- First Name - Required -->
        <div class="relative">
          <input
            :value="employeeForm.first_name"
            type="text"
            :class="['w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-delta-blue', firstNameValid ? 'border-gray-300' : 'border-red-300 focus:border-red-400']"
            placeholder="First name"
            @input="updateField('first_name', ($event.target as HTMLInputElement).value)"
          />
          <p class="mt-1 text-xs text-gray-500">
            <span :class="employeeForm.first_name.trim().length > 0 ? 'text-emerald-600' : 'text-red-500'">✓</span> Required
          </p>
        </div>

        <!-- Last Name - Required -->
        <div class="relative">
          <input
            :value="employeeForm.last_name"
            type="text"
            :class="['w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-delta-blue', lastNameValid ? 'border-gray-300' : 'border-red-300 focus:border-red-400']"
            placeholder="Last name"
            @input="updateField('last_name', ($event.target as HTMLInputElement).value)"
          />
          <p class="mt-1 text-xs text-gray-500">
            <span :class="employeeForm.last_name.trim().length > 0 ? 'text-emerald-600' : 'text-red-500'">✓</span> Required
          </p>
        </div>

        <!-- Base Salary - Optional -->
        <div class="relative sm:col-span-2">
          <input
            :value="employeeForm.base_salary ?? ''"
            type="number"
            min="0"
            step="0.01"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-delta-blue"
            placeholder="Base salary (optional)"
            @input="onBaseSalaryInput"
          />
          <p class="mt-1 text-xs text-gray-500">Optional · Annual base salary in USD</p>
        </div>
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
import { computed } from 'vue'
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

// Username validation
const usernameLengthValid = computed(() => {
  const len = props.employeeForm.username.trim().length
  return len >= 3 && len <= 50
})

const usernameFormatValid = computed(() => {
  // Allow letters, numbers, dots, and hyphens only
  const regex = /^[a-zA-Z0-9.-]*$/
  return regex.test(props.employeeForm.username.trim())
})

const usernameValid = computed(() => {
  if (props.employeeForm.username.trim().length === 0) return true // Don't show error on empty
  return usernameLengthValid.value && usernameFormatValid.value
})

// Password validation
const passwordLengthValid = computed(() => {
  const len = props.employeeForm.password.length
  return len >= 8 && len <= 100
})

const passwordValid = computed(() => {
  if (props.employeeForm.password.length === 0) return true // Don't show error on empty
  return passwordLengthValid.value
})

// Employee-specific field validations
const quickbooksIdValid = computed(() => {
  if (props.employeeForm.role !== 'empleado') return true
  return props.employeeForm.quickbooks_id.trim().length > 0
})

const firstNameValid = computed(() => {
  if (props.employeeForm.role !== 'empleado') return true
  return props.employeeForm.first_name.trim().length > 0
})

const lastNameValid = computed(() => {
  if (props.employeeForm.role !== 'empleado') return true
  return props.employeeForm.last_name.trim().length > 0
})

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
