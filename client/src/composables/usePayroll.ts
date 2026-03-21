import { ref } from 'vue'
import { getMisRecibos, getReciboPdf } from '../api/payroll'
import { recibosMock } from '../mock-data'
import { useAuthStore } from '../store/auth'
import type { Recibo } from '../types/payroll'

const USE_LOCAL_MOCK = import.meta.env.VITE_USE_LOCAL_MOCK === 'true'

export const usePayroll = () => {
  const authStore = useAuthStore()
  const recibos = ref<Recibo[]>([])
  const reciboSeleccionado = ref<Recibo | null>(null)
  const loading = ref(false)
  const errorMessage = ref('')

  const isMockSession = () => USE_LOCAL_MOCK || authStore.token === 'mock-token'

  const cargarRecibos = async () => {
    loading.value = true
    errorMessage.value = ''

    if (isMockSession()) {
      recibos.value = recibosMock
      loading.value = false
      return
    }

    try {
      recibos.value = await getMisRecibos()
    } catch {
      errorMessage.value = 'No fue posible cargar los recibos.'
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
    if (isMockSession()) {
      return false
    }

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
    } catch {
      errorMessage.value = 'No fue posible descargar el PDF. Se abrirá para impresión.'
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
