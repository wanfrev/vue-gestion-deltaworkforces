import { DataTypes, Sequelize } from 'sequelize'

const createPaymentRecordModel = (sequelize: Sequelize) => {
  const PaymentRecord = sequelize.define(
    'PaymentRecord',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      pay_period: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gross_earnings: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_deductions: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      net_pay: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      check_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paystub_key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      import_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'payment_records',
      underscored: true,
      timestamps: true,
    },
  )

  return PaymentRecord
}

export default createPaymentRecordModel
