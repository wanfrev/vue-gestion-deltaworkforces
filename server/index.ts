import cors from 'cors'
import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import { sequelize } from './models'
import apiRoutes from './routes/api'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, msg: 'API de Nómina funcionando 🚀' })
})

app.use('/api', apiRoutes)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ msg: 'Error interno del servidor.' })
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
