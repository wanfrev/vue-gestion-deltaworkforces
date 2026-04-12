import axios from 'axios'
import { getReciboPdf } from '../api/payroll'
import { useAuthStore } from '../store/auth'
import type { Recibo } from '../types/payroll'

interface UsePayrollDocumentActionsOptions {
  setErrorMessage: (message: string) => void
}

export const usePayrollDocumentActions = ({
  setErrorMessage,
}: UsePayrollDocumentActionsOptions) => {
  const authStore = useAuthStore()

  const descargarPdf = async (recibo: Recibo) => {
    try {
      const blob = await getReciboPdf(recibo.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt-${recibo.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        authStore.clearSession()
        setErrorMessage('Your session expired. Sign in again.')
      } else {
        setErrorMessage('Could not download the PDF. It will open for printing.')
      }

      return false
    }
  }

  return {
    descargarPdf,
  }
}
