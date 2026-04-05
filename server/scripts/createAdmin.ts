import bcrypt from 'bcrypt'
import { sequelize, User } from '../models'

const DEFAULT_ADMIN_USERNAME = 'admin_delta'
const DEFAULT_ADMIN_PASSWORD = 'admin1234'

async function main() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a DB OK')

    const username = String(process.env.ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME)
      .trim()
      .toLowerCase()
    const password = String(process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD).trim()

    if (!username) {
      throw new Error('ADMIN_USERNAME no puede estar vacío.')
    }

    if (!password) {
      throw new Error('Debes definir ADMIN_PASSWORD para crear el admin.')
    }

    if (password.length < 8) {
      throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [adminUser, created] = await User.findOrCreate({
      where: { username },
      defaults: {
        username,
        password_hash: passwordHash,
        role: 'admin',
      },
    })

    if (!created) {
      adminUser.set('password_hash', passwordHash)
      adminUser.set('role', 'admin')
      await adminUser.save()
      console.log(`Usuario admin actualizado: ${username}`)
    } else {
      console.log(`Usuario admin creado: ${username}`)
    }

    await sequelize.close()
    process.exit(0)
  } catch (error) {
    console.error('Error creando admin:', error)
    process.exit(1)
  }
}

main()
