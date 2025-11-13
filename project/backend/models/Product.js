import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('laptop', 'desktop', 'monitor', 'accessory', 'component'),
    allowNull: false
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'cost_price',
    validate: {
      min: 0
    }
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'selling_price',
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'supplier_id',
    references: {
      model: 'suppliers',
      key: 'id'
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at', // Явно указываем имя поля
  updatedAt: 'updated_at'  // Явно указываем имя поля
  
  
});

Product.prototype.getProfitMargin = function() {
  return parseFloat((this.sellingPrice - this.costPrice).toFixed(2));
};

Product.prototype.getProfitability = function() {
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
};

export default Product;