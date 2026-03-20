import { DataTypes, Sequelize } from 'sequelize'

const createReciboModel = (sequelize: Sequelize) => {
  const Recibo = sequelize.define(
    'Recibo',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fecha_pago: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      periodo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      detalles: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'recibos',
      underscored: true,
      timestamps: true,
    },
  )

  return Recibo
}

export default createReciboModel
