import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'manager_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'branches',
  timestamps: true,
  createdAt: 'created_at', // Явно указываем имя поля
  updatedAt: 'updated_at'  // Явно указываем имя поля
  
});

export default Branch;