import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id'
    }
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'branch_id',
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price',
    validate: {
      min: 0
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
    validate: {
      min: 0
    }
  },
  saleDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'sale_date'
  }
}, {
  tableName: 'sales',
  timestamps: true,
  createdAt: 'created_at', // Явно указываем имя поля
  updatedAt: 'updated_at', // Явно указываем имя поля
  
  hooks: {
    beforeSave: (sale) => {
      if (sale.quantity && sale.unitPrice) {
        sale.totalAmount = sale.quantity * sale.unitPrice;
      }
    }
  }
});

export default Sale;