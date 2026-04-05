import { DataTypes, Sequelize } from 'sequelize'

const createEmployeeModel = (sequelize: Sequelize) => {
  const Employee = sequelize.define(
    'Employee',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      quickbooks_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      base_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'employees',
      underscored: true,
      timestamps: true,
    },
  )

  return Employee
}

export default createEmployeeModel
