import sequelize from '../config/db'
import createUserModel from './User'
import createEmployeeModel from './Employee'
import createPaymentRecordModel from './PaymentRecord'

const User = createUserModel(sequelize)
const Employee = createEmployeeModel(sequelize)
const PaymentRecord = createPaymentRecordModel(sequelize)

User.hasOne(Employee, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
})

Employee.belongsTo(User, {
  foreignKey: 'user_id',
})

Employee.hasMany(PaymentRecord, {
  foreignKey: 'employee_id',
  onDelete: 'CASCADE',
})

PaymentRecord.belongsTo(Employee, {
  foreignKey: 'employee_id',
})

export { sequelize, User, Employee, PaymentRecord }
