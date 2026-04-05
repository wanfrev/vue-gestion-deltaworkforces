import bcrypt from 'bcrypt'
import { Employee, sequelize, User } from '../models'

async function main() {
  try {
    await sequelize.authenticate()
    console.log('Conexión a DB OK')

    const users = [
      {
        username: 'admin.delta',
        password: 'admin1234',
        role: 'admin',
      },
      {
        username: 'jdoe2024',
        password: 'empleado1234',
        role: 'empleado',
        employee: {
          quickbooksId: 'Juan Perez',
          firstName: 'Juan',
          lastName: 'Perez',
          position: 'Operador',
        },
      },
    ]

    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, 10)

      const [user, created] = await User.findOrCreate({
        where: { username: u.username },
        defaults: {
          password_hash: passwordHash,
          role: u.role,
        },
      })

      if (created) {
        console.log(`Usuario creado: ${u.username} (${u.role})`)
      } else {
        user.set('role', u.role)
        user.set('password_hash', passwordHash)
        await user.save()
        console.log(`Usuario actualizado: ${u.username} (${u.role})`)
      }

      if (u.employee) {
        const [employee, employeeCreated] = await Employee.findOrCreate({
          where: { quickbooks_id: u.employee.quickbooksId },
          defaults: {
            quickbooks_id: u.employee.quickbooksId,
            first_name: u.employee.firstName,
            last_name: u.employee.lastName,
            position: u.employee.position,
            user_id: user.getDataValue('id'),
          },
        })

        if (!employeeCreated) {
          employee.set('first_name', u.employee.firstName)
          employee.set('last_name', u.employee.lastName)
          employee.set('position', u.employee.position)
          employee.set('user_id', user.getDataValue('id'))
          await employee.save()
        }

        console.log(
          employeeCreated
            ? `Empleado creado: ${u.employee.quickbooksId}`
            : `Empleado actualizado: ${u.employee.quickbooksId}`,
        )
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
