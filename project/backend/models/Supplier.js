import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyName: {
    type: DataTypes.STRING(100),
    field: 'company_name',
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'contact_person',
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
  address: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  createdAt: 'created_at', // Явно указываем имя поля
  updatedAt: 'updated_at'  // Явно указываем имя поля
  
});

export default Supplier;