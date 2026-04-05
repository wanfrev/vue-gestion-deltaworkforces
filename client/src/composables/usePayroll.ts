import { ref } from 'vue'
import axios from 'axios'
import { getMisRecibos, getReciboPdf } from '../api/payroll'
import { useAuthStore } from '../store/auth'
import type { Recibo } from '../types/payroll'

export const usePayroll = () => {
  const authStore = useAuthStore()
  const recibos = ref<Recibo[]>([])
  const reciboSeleccionado = ref<Recibo | null>(null)
  const loading = ref(false)
  const errorMessage = ref('')

  const cargarRecibos = async () => {
    loading.value = true
    errorMessage.value = ''

    try {
      recibos.value = await getMisRecibos()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        authStore.clearSession()
        errorMessage.value = 'Tu sesión expiró. Inicia sesión nuevamente.'
      } else {
        errorMessage.value = 'No fue posible cargar los recibos.'
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

  const descargarPdf = async (recibo: Recibo) => {
    try {
      const blob = await getReciboPdf(recibo.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `recibo-${recibo.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        authStore.clearSession()
        errorMessage.value = 'Tu sesión expiró. Inicia sesión nuevamente.'
      } else {
        errorMessage.value = 'No fue posible descargar el PDF. Se abrirá para impresión.'
      }

      return false
    }
  }

  return {
    recibos,
    reciboSeleccionado,
    loading,
    errorMessage,
    cargarRecibos,
    seleccionarRecibo,
    limpiarReciboSeleccionado,
    descargarPdf,
  }
}
