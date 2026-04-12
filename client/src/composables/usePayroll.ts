import { usePayrollData } from './usePayrollData'
import { usePayrollDocumentActions } from './usePayrollDocumentActions'

export const usePayroll = () => {
  const payrollData = usePayrollData()
  const payrollDocumentActions = usePayrollDocumentActions({
    setErrorMessage: payrollData.setErrorMessage,
  })
  const {
    setErrorMessage,
    ...payrollState
  } = payrollData
  void setErrorMessage

  return {
    ...payrollState,
    ...payrollDocumentActions,
  }
}
