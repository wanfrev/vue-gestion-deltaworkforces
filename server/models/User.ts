import { DataTypes, Sequelize } from 'sequelize'

const createUserModel = (sequelize: Sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('superadmin', 'admin', 'empleado'),
        allowNull: false,
        defaultValue: 'empleado',
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
    },
  )

  return User
}

export default createUserModel
