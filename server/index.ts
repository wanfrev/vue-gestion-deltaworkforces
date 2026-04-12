import cors from 'cors'
import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import { sequelize } from './models'
import apiRoutes from './routes/api'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '10mb'

app.use(cors())
app.use(express.json({ limit: requestBodyLimit }))
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }))

app.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, msg: 'API de Nómina funcionando 🚀' })
})

app.use('/api', apiRoutes)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large'
  ) {
    return res.status(413).json({
      msg: `El archivo es demasiado grande. Límite actual: ${requestBodyLimit}.`,
    })
  }

  console.error(err)
  return res.status(500).json({ msg: 'Error interno del servidor.' })
})

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true })
    console.log('✅ Base de datos conectada y tablas sincronizadas.')

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Error al conectar la base de datos:', error)
  }
}

startServer()
