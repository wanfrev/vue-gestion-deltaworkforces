import express from 'express'
import auth from '../middleware/auth'
import roleAuth from '../middleware/roleAuth'
import { login } from '../controllers/authController'
import { getRecibosAdmin, importarNomina } from '../controllers/adminController'
import { getMiReciboPDF, getMisUltimosRecibos } from '../controllers/reciboController'
import { ROLES } from '../constants/roles'

const router = express.Router()

router.post('/login', login)
router.post('/admin/importar-nomina', auth, roleAuth(ROLES.ADMIN), importarNomina)
router.get('/admin/recibos', auth, roleAuth(ROLES.ADMIN), getRecibosAdmin)
router.get('/mis-recibos', auth, roleAuth(ROLES.EMPLEADO), getMisUltimosRecibos)
router.get('/mis-recibos/:id/pdf', auth, roleAuth(ROLES.EMPLEADO), getMiReciboPDF)
router.get('/recibos', auth, roleAuth(ROLES.EMPLEADO), getMisUltimosRecibos)
router.get('/recibos/:id/pdf', auth, roleAuth(ROLES.EMPLEADO), getMiReciboPDF)

export default router
