import bcrypt from 'bcrypt'
import { Employee, User, sequelize } from '../models'

const DAINETH = {
  username: 'daineth.diaz',
  password: 'daineth123',
  role: 'empleado',
  quickbooksId: 'DAINETH DIAZ',
  firstName: 'Daineth',
  lastName: 'Diaz',
  position: 'Operaria',
  baseSalary: 11.5,
}

async function main() {
  const transaction = await sequelize.transaction()

  try {
    await sequelize.authenticate()
    console.log('Conexión a DB OK')

    const passwordHash = await bcrypt.hash(DAINETH.password, 10)

    const [user, userCreated] = await User.findOrCreate({
      where: { username: DAINETH.username },
      defaults: {
        username: DAINETH.username,
        password_hash: passwordHash,
        role: DAINETH.role,
      },
      transaction,
    })

    if (!userCreated) {
      user.set('password_hash', passwordHash)
      user.set('role', DAINETH.role)
      await user.save({ transaction })
    }

    const [employee, employeeCreated] = await Employee.findOrCreate({
      where: { quickbooks_id: DAINETH.quickbooksId },
      defaults: {
        user_id: user.getDataValue('id'),
        quickbooks_id: DAINETH.quickbooksId,
        first_name: DAINETH.firstName,
        last_name: DAINETH.lastName,
        position: DAINETH.position,
        base_salary: DAINETH.baseSalary,
      },
      transaction,
    })

    if (!employeeCreated) {
      employee.set('user_id', user.getDataValue('id'))
      employee.set('first_name', DAINETH.firstName)
      employee.set('last_name', DAINETH.lastName)
      employee.set('position', DAINETH.position)
      employee.set('base_salary', DAINETH.baseSalary)
      await employee.save({ transaction })
    }

    await transaction.commit()

    console.log(
      employeeCreated
        ? '✅ Empleada Daineth Diaz creada con éxito'
        : '✅ Empleada Daineth Diaz actualizada con éxito',
    )

    await sequelize.close()
    process.exit(0)
  } catch (error) {
    await transaction.rollback()
    console.error('Error al crear/actualizar a Daineth Diaz:', error)
    process.exit(1)
  }
}

main()
