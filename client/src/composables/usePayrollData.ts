import axios from 'axios'
import { ref } from 'vue'
import { getMisRecibos } from '../api/payroll'
import { useAuthStore } from '../store/auth'
import type { Recibo } from '../types/payroll'

export const usePayrollData = () => {
  const authStore = useAuthStore()
  const recibos = ref<Recibo[]>([])
  const reciboSeleccionado = ref<Recibo | null>(null)
  const loading = ref(false)
  const errorMessage = ref('')

  const cargarRecibos = async (limit = 4) => {
    loading.value = true
    errorMessage.value = ''

    try {
      recibos.value = await getMisRecibos(limit)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        authStore.clearSession()
        errorMessage.value = 'Your session expired. Sign in again.'
      } else {
        errorMessage.value = 'Could not load receipts.'
      }

      recibos.value = []
    } finally {
      loading.value = false
    }
  }

  const seleccionarRecibo = (recibo: Recibo) => {
    reciboSeleccionado.value = recibo
  }

  const limpiarReciboSeleccionado = () => {
    reciboSeleccionado.value = null
  }

  const setErrorMessage = (message: string) => {
    errorMessage.value = message
  }

  return {
    recibos,
    reciboSeleccionado,
    loading,
    errorMessage,
    cargarRecibos,
    seleccionarRecibo,
    limpiarReciboSeleccionado,
    setErrorMessage,
  }
}
