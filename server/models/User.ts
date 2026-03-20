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
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rol: {
        type: DataTypes.STRING,
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
