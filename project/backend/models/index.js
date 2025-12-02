import sequelize from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import Branch from './Branch.js';
import Sale from './Sale.js';
import Supplier from './Supplier.js';

// Define associations
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });

Sale.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Sale.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Branch.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.belongsTo(Branch, { 
  foreignKey: 'branchId', 
  as: 'branch' 
});
User.hasMany(Branch, { foreignKey: 'managerId', as: 'managedBranches' });

Product.hasMany(Sale, { foreignKey: 'productId', as: 'sales' });
Branch.hasMany(Sale, { foreignKey: 'branchId', as: 'sales' });
Branch.hasMany(User, { 
  foreignKey: 'branchId', 
  as: 'managers' 
});
User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });

const models = {
  User,
  Product,
  Branch,
  Sale,
  Supplier
};

export { sequelize, models };