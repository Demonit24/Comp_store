import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';

const router = express.Router();

// Get all sales with filtering and sorting
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product, Branch, User } = req.models;
    const {
      productId,
      branchId,
      userId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'sale_date',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    console.log('GET /api/sales - Start with filters:', req.query);

    // Build where conditions
    const where = {};

    if (productId) where.productId = productId;
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    
    // Date range filter
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate[Op.gte] = new Date(startDate);
      if (endDate) where.saleDate[Op.lte] = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.totalAmount[Op.lte] = parseFloat(maxAmount);
    }

    // Build order
    const order = [];
    const sortFields = {
      saleDate: 'sale_date',
      totalAmount: 'total_amount',
      quantity: 'quantity',
      unitPrice: 'unit_price',
      createdAt: 'created_at'
    };
    

    if (sortFields[sortBy]) {
      order.push([sortFields[sortBy], sortOrder]);
    } else {
      order.push(['sale_date', 'DESC']);
    }

    const offset = (page - 1) * limit;

    console.log('Sales query conditions:', where);
    console.log('Sort order:', order);

    const { count, rows: sales } = await Sale.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'costPrice', 'sellingPrice']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [order]
    });

    console.log(`Found ${count} sales, returning ${sales.length}`);

    // Calculate additional metrics
    const salesWithMetrics = sales.map(sale => {
      const saleJSON = sale.toJSON();
      const profit = sale.quantity * (sale.product.sellingPrice - sale.product.costPrice);
      const profitability = sale.product.costPrice > 0 ? 
        (profit / (sale.quantity * sale.product.costPrice) * 100).toFixed(2) : 0;

      return {
        ...saleJSON,
        profit: parseFloat(profit.toFixed(2)),
        profitability: parseFloat(profitability)
      };
    });

    res.json({
      sales: salesWithMetrics,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });

  } catch (error) {
    console.error('Error loading sales:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sales statistics for filters
router.get('/filters-data', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product, Branch, User } = req.models;
    
    // Get available products
    const products = await Product.findAll({
      attributes: ['id', 'name'],
      limit: 50
    });

    // Get available branches
    const branches = await Branch.findAll({
      attributes: ['id', 'name']
    });

    // Get available users
    const users = await User.findAll({
      attributes: ['id', 'login'],
      limit: 50
    });

    res.json({
      products,
      branches,
      users
    });

  } catch (error) {
    console.error('Error loading sales filter data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create sale
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, branchId, quantity, unitPrice } = req.body;
    
    console.log('Creating sale with data:', { productId, branchId, quantity, unitPrice });
    
    // Проверяем существование товара
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    
    // Проверяем существование филиала
    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Филиал не найден' });
    }
    
    // Проверяем количество товара
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Недостаточно товара на складе' });
    }
    
    // Создаем продажу
    const sale = await Sale.create({
      productId,
      branchId,
      userId: req.user.id,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice
    });
    
    // Обновляем количество товара
    await product.update({
      quantity: product.quantity - quantity
    });
    
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update sale
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product, Branch } = req.models;
    const { id } = req.params;
    const { productId, branchId, quantity, unitPrice } = req.body;
    
    console.log('Updating sale:', id, { productId, branchId, quantity, unitPrice });
    
    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({ message: 'Продажа не найдена' });
    }
    
    const product = await Product.findByPk(productId || sale.productId);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    
    const branch = await Branch.findByPk(branchId || sale.branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Филиал не найден' });
    }
    
    // Если меняется количество, проверяем доступность
    if (quantity && quantity !== sale.quantity) {
      const available = product.quantity + sale.quantity;
      if (available < quantity) {
        return res.status(400).json({ message: 'Недостаточно товара на складе' });
      }
      
      await product.update({
        quantity: available - quantity
      });
    }
    
    await sale.update({
      productId: productId || sale.productId,
      branchId: branchId || sale.branchId,
      quantity: quantity || sale.quantity,
      unitPrice: unitPrice || sale.unitPrice,
      totalAmount: (quantity || sale.quantity) * (unitPrice || sale.unitPrice)
    });
    
    const updatedSale = await Sale.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'email']
        }
      ]
    });
    
    res.json(updatedSale);
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete sale
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product } = req.models;
    const { id } = req.params;
    
    console.log('Deleting sale:', id);
    
    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({ message: 'Продажа не найдена' });
    }
    
    // Возвращаем товар на склад
    const product = await Product.findByPk(sale.productId);
    if (product) {
      await product.update({
        quantity: product.quantity + sale.quantity
      });
    }
    
    await sale.destroy();
    
    res.json({ message: 'Продажа удалена успешно' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;