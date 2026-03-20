import sequelize from '../config/db'
import createUserModel from './User'
import createReciboModel from './Recibo'

const User = createUserModel(sequelize)
const Recibo = createReciboModel(sequelize)

User.hasMany(Recibo, {
  foreignKey: 'UserId',
  onDelete: 'CASCADE',
})

Recibo.belongsTo(User, {
  foreignKey: 'UserId',
})

export { sequelize, User, Recibo }
