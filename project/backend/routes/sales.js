import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

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

    // Build where conditions - аналогично products
    const where = {};
    
    if (productId) where.productId = productId;
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    
    // Date range filter
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate[Op.gte] = new Date(startDate);
        console.log('Start date filter:', where.saleDate[Op.gte]);
      }
      if (endDate) {
        where.saleDate[Op.lte] = new Date(endDate);
        console.log('End date filter:', where.saleDate[Op.lte]);
      }
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) {
        where.totalAmount[Op.gte] = parseFloat(minAmount);
        console.log('Min amount filter:', where.totalAmount[Op.gte]);
      }
      if (maxAmount) {
        where.totalAmount[Op.lte] = parseFloat(maxAmount);
        console.log('Max amount filter:', where.totalAmount[Op.lte]);
      }
    }

    // Build order - упрощенная версия как в products
    const order = [];
    const sortFields = {
      saleDate: 'sale_date',
      totalAmount: 'total_amount',
      quantity: 'quantity',
      unitPrice: 'unit_price',
      createdAt: 'created_at'
    };

    // Простая сортировка по полям таблицы
    if (sortFields[sortBy]) {
      order.push([sortFields[sortBy], sortOrder]);
    } else {
      order.push(['sale_date', 'DESC']);
    }

    const offset = (page - 1) * limit;

    console.log('Sales query conditions:', where);
    console.log('Sort order:', order);

    // Выполняем запрос аналогично products
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
      order
    });

    console.log(`Found ${count} sales, returning ${sales.length}`);

    // Форматируем ответ аналогично products
    res.json({
      sales: sales,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });

  } catch (error) {
    console.error('Error loading sales:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get sales statistics for filters
router.get('/filters-data', authenticateToken, async (req, res) => {
  try {
    const { Product, Branch, User } = req.models;
    
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
    const { Sale, Product, Branch } = req.models;

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

    // Возвращаем созданную продажу с включенными данными
    const createdSale = await Sale.findByPk(sale.id, {
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

    res.status(201).json(createdSale);
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