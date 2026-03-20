import express from 'express'
import auth from '../middleware/auth'
import roleAuth from '../middleware/roleAuth'
import { login } from '../controllers/authController'
import { importarNomina } from '../controllers/adminController'
import { getMiReciboPDF, getMisUltimosRecibos } from '../controllers/reciboController'

const router = express.Router()

router.post('/login', login)
router.post('/admin/importar-nomina', auth, roleAuth('admin'), importarNomina)
router.get('/mis-recibos', auth, getMisUltimosRecibos)
router.get('/mis-recibos/:id/pdf', auth, getMiReciboPDF)
router.get('/recibos', auth, getMisUltimosRecibos)
router.get('/recibos/:id/pdf', auth, getMiReciboPDF)

export default router
