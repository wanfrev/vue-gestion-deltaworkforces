import express from 'express'
import auth from '../middleware/auth'
import roleAuth from '../middleware/roleAuth'
import { login } from '../controllers/authController'
import {
	createEmployeeByAdmin,
	deleteEmployeeByAdmin,
	deleteEmployeePaymentRecords,
	getRecibosAdmin,
	importarNomina,
	updateEmployeePasswordByAdmin,
} from '../controllers/adminController'
import { getMiReciboPDF, getMisUltimosRecibos } from '../controllers/reciboController'
import { ROLES } from '../constants/roles'

const router = express.Router()

router.post('/login', login)
router.post('/admin/importar-nomina', auth, roleAuth(ROLES.ADMIN), importarNomina)
router.post('/admin/empleados', auth, roleAuth(ROLES.ADMIN), createEmployeeByAdmin)
router.get('/admin/recibos', auth, roleAuth(ROLES.ADMIN), getRecibosAdmin)
router.delete('/admin/empleados/:employeeId/recibos', auth, roleAuth(ROLES.ADMIN), deleteEmployeePaymentRecords)
router.patch('/admin/empleados/:employeeId/password', auth, roleAuth(ROLES.ADMIN), updateEmployeePasswordByAdmin)
router.delete('/admin/empleados/:employeeId', auth, roleAuth(ROLES.ADMIN), deleteEmployeeByAdmin)
router.get('/mis-recibos', auth, roleAuth(ROLES.EMPLEADO), getMisUltimosRecibos)
router.get('/mis-recibos/:id/pdf', auth, roleAuth(ROLES.EMPLEADO), getMiReciboPDF)
router.get('/recibos', auth, roleAuth(ROLES.EMPLEADO), getMisUltimosRecibos)
router.get('/recibos/:id/pdf', auth, roleAuth(ROLES.EMPLEADO), getMiReciboPDF)

export default router
