import bcrypt from 'bcrypt'
import { sequelize, User } from '../models'

async function main() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a DB OK')

    const users = [
      { email: 'admin@delta.test', nombre: 'Admin Delta', password: 'admin1234', rol: 'admin' },
      { email: 'empleado@delta.test', nombre: 'Empleado Delta', password: 'empleado1234', rol: 'empleado' },
    ]

    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, 10)

      const [user, created] = await User.findOrCreate({
        where: { email: u.email },
        defaults: {
          nombre: u.nombre,
          password_hash: passwordHash,
          rol: u.rol,
        },
      })

      if (created) {
        console.log(`Usuario creado: ${u.email} (${u.rol})`)
      } else {
        user.set('nombre', u.nombre)
        user.set('rol', u.rol)
        user.set('password_hash', passwordHash)
        await user.save()
        console.log(`Usuario actualizado: ${u.email} (${u.rol})`)
      }
    }

    await sequelize.close()
    console.log('Proceso finalizado.')
  } catch (err) {
    console.error('Error en seed:', err)
    process.exit(1)
  }
}

main()
