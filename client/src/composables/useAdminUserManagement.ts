import { ref } from 'vue'
import { createEmployeeAdmin, deleteEmployeePaymentRecordsAdmin } from '../api/admin'

interface EmployeeFormState {
  username: string
  password: string
  role: 'admin' | 'empleado'
  quickbooks_id: string
  first_name: string
  last_name: string
  position: string
  base_salary: number | undefined
}

interface DeleteEmployeeCandidate {
  employeeId: number
  nombre: string
  registros: number
}

interface UseAdminUserManagementOptions {
  limpiarMensajes: () => void
  setSuccessMessage: (message: string) => void
  setErrorMessage: (message: string) => void
  cargarRecibosAdmin: (query?: string, limit?: number) => Promise<void>
  cerrarMenuEmpleado: () => void
}

export const useAdminUserManagement = ({
  limpiarMensajes,
  setSuccessMessage,
  setErrorMessage,
  cargarRecibosAdmin,
  cerrarMenuEmpleado,
}: UseAdminUserManagementOptions) => {
  const creatingEmployee = ref(false)
  const deletingEmployeeId = ref<number | null>(null)
  const employeeForm = ref<EmployeeFormState>({
    username: '',
    password: '',
    role: 'empleado',
    quickbooks_id: '',
    first_name: '',
    last_name: '',
    position: '',
    base_salary: undefined,
  })

  const updateEmployeeForm = (nextForm: EmployeeFormState) => {
    employeeForm.value = nextForm
  }

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
      setErrorMessage('Complete username and password.')
      return
    }

    if (
      payload.role === 'empleado' &&
      (!payload.quickbooks_id || !payload.first_name || !payload.last_name)
    ) {
      setErrorMessage('For employee users, quickbooks_id, first_name, and last_name are required.')
      return
    }

    creatingEmployee.value = true

    try {
      await createEmployeeAdmin(payload)
      setSuccessMessage(payload.role === 'admin' ? 'Admin user created successfully.' : 'Employee user created successfully.')
      limpiarFormularioEmpleado()
      await cargarRecibosAdmin('', 200)
    } catch (error) {
      void error
      setErrorMessage('Could not create the user.')
    } finally {
      creatingEmployee.value = false
    }
  }

  const borrarRegistrosEmpleado = async (employeeId: number, nombre: string, registros: number) => {
    const confirmado = window.confirm(
      `${registros} payroll record(s) for ${nombre} will be deleted. This action cannot be undone.`,
    )

    if (!confirmado) {
      return
    }

    deletingEmployeeId.value = employeeId

    try {
      const response = await deleteEmployeePaymentRecordsAdmin(employeeId)
      setSuccessMessage(`Employee records deleted successfully. Deleted: ${response.deletedCount}.`)
      await cargarRecibosAdmin('', 200)
    } catch (error) {
      void error
      setErrorMessage('Could not delete employee records.')
    } finally {
      deletingEmployeeId.value = null
    }
  }

  const eliminarRegistrosDesdeMenu = async (empleado: DeleteEmployeeCandidate) => {
    cerrarMenuEmpleado()
    await borrarRegistrosEmpleado(empleado.employeeId, empleado.nombre, empleado.registros)
  }

  return {
    employeeForm,
    creatingEmployee,
    deletingEmployeeId,
    updateEmployeeForm,
    limpiarFormularioEmpleado,
    crearEmpleado,
    eliminarRegistrosDesdeMenu,
  }
}
