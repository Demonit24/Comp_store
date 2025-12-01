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
    console.log('GET /api/sales - User role:', req.user.role, 'Branch ID:', req.user.branchId);

    
    // Build where conditions - аналогично products
    const where = {};
    
    // Автоматическая фильтрация для менеджера филиала
    let finalBranchId = branchId;
    if (req.user.role === 'branch_manager' && req.user.branchId) {
      finalBranchId = req.user.branchId;
      console.log('Manager access - filtering by branch:', finalBranchId);
    }

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
    const { Sale, Product, Branch, User } = req.models; // Добавляем User

    console.log('Creating sale - User role:', req.user.role, 'User branchId:', req.user.branchId);
    console.log('Request body:', req.body);

    // Определяем finalBranchId
    let finalBranchId = branchId;
    
    // Для менеджера филиала используем его branchId
    if (req.user.role === 'branch_manager') {
      finalBranchId = req.user.branchId;
      console.log('Manager sale - using branchId:', finalBranchId);
    }

    // Проверяем, что finalBranchId определен
    if (!finalBranchId) {
      return res.status(400).json({ message: 'Не указан филиал для продажи' });
    }

    // Проверяем существование товара
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    // Проверяем существование филиала
    const branch = await Branch.findByPk(finalBranchId);
    if (!branch) {
      console.log('Branch not found with ID:', finalBranchId);
      return res.status(404).json({ message: `Филиал с ID ${finalBranchId} не найден` });
    }

    console.log('Found branch:', branch.name);

    // Проверяем количество товара
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Недостаточно товара на складе' });
    }

    // Создаем продажу
    const sale = await Sale.create({
      productId,
      branchId: finalBranchId,
      userId: req.user.id,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      saleDate: new Date()
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
          model: User, // Теперь User определен
          as: 'user',
          attributes: ['id', 'login', 'email']
        }
      ]
    });

    console.log('Sale created successfully:', createdSale.id);
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

// Get branch statistics
router.get('/branch-stats/:branchId', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product } = req.models;
    const { branchId } = req.params;
    
    console.log('Getting stats for branch:', branchId);

    // Проверяем права доступа для менеджера филиала
    if (req.user.role === 'branch_manager' && parseInt(branchId) !== parseInt(req.user.branchId)) {
      return res.status(403).json({ message: 'Доступ запрещен к статистике другого филиала' });
    }

    // Получаем все продажи филиала
    const sales = await Sale.findAll({
      where: { branchId },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'costPrice']
      }]
    });

    // Рассчитываем статистику
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => {
      if (!sale.saleDate) return false;
      const saleDate = new Date(sale.saleDate).toISOString().split('T')[0];
      return saleDate === today;
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0);

    // Рассчитываем прибыль
    const totalProfit = sales.reduce((sum, sale) => {
      const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
      const revenue = parseFloat(sale.totalAmount);
      return sum + (revenue - cost);
    }, 0);

    res.json({
      todaySales: todaySales.length,
      todayRevenue,
      totalSales: sales.length,
      totalRevenue,
      totalProfit: totalProfit.toFixed(2),
      averageSale: sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Error loading branch stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;