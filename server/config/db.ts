import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

dotenv.config()

const dbUrl = process.env.DATABASE_URL as string

const isLocal = dbUrl?.includes('localhost') || dbUrl?.includes('127.0.0.1')

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: isLocal
    ? undefined
    : {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
  logging: false,
})

export default sequelize
