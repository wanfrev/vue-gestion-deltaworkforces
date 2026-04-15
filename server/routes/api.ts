import express from 'express'
import auth from '../middleware/auth'
import roleAuth from '../middleware/roleAuth'
import { login } from '../controllers/authController'
import {
	createEmployeeByAdmin,
	deleteEmployeeByAdmin,
	deletePrivilegedUserBySuperadmin,
	deleteEmployeePaymentRecords,
	getEmployeesAdmin,
	getPrivilegedUsersBySuperadmin,
	getRecibosAdmin,
	importarNomina,
	updateEmployeePasswordByAdmin,
} from '../controllers/adminController'
import { getMiReciboPDF, getMisUltimosRecibos } from '../controllers/reciboController'
import { ROLES } from '../constants/roles'

const router = express.Router()
const ADMIN_PANEL_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN]

router.post('/login', login)
router.post('/admin/importar-nomina', auth, roleAuth(ADMIN_PANEL_ROLES), importarNomina)
router.post('/admin/empleados', auth, roleAuth(ADMIN_PANEL_ROLES), createEmployeeByAdmin)
router.get('/admin/empleados', auth, roleAuth(ADMIN_PANEL_ROLES), getEmployeesAdmin)
router.get('/admin/recibos', auth, roleAuth(ADMIN_PANEL_ROLES), getRecibosAdmin)
router.delete('/admin/empleados/:employeeId/recibos', auth, roleAuth(ADMIN_PANEL_ROLES), deleteEmployeePaymentRecords)
router.patch('/admin/empleados/:employeeId/password', auth, roleAuth(ADMIN_PANEL_ROLES), updateEmployeePasswordByAdmin)
router.delete('/admin/empleados/:employeeId', auth, roleAuth(ADMIN_PANEL_ROLES), deleteEmployeeByAdmin)
router.get('/admin/privileged-users', auth, roleAuth(ADMIN_PANEL_ROLES), getPrivilegedUsersBySuperadmin)
router.delete('/admin/privileged-users/:userId', auth, roleAuth(ADMIN_PANEL_ROLES), deletePrivilegedUserBySuperadmin)
router.get('/mis-recibos', auth, roleAuth(ROLES.EMPLEADO), getMisUltimosRecibos)
router.get('/mis-recibos/:id/pdf', auth, roleAuth(ROLES.EMPLEADO), getMiReciboPDF)
router.get('/recibos', auth, roleAuth(ROLES.EMPLEADO), getMisUltimosRecibos)
router.get('/recibos/:id/pdf', auth, roleAuth(ROLES.EMPLEADO), getMiReciboPDF)

export default router
