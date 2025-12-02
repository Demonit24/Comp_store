import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { Product, Sale, Branch } = req.models;
    
    console.log('Loading dashboard statistics...');

    // Получаем все продукты
    const products = await Product.findAll({
      attributes: ['id', 'name', 'category', 'costPrice', 'sellingPrice', 'quantity']
    });

    // Получаем все продажи
    const sales = await Sale.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'costPrice']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ],
      order: [['sale_date', 'DESC']],
      limit: 1000
    });

    // Рассчитываем статистику
    const totalProducts = products.length;
    const totalSales = sales.length;
    
    // Общая выручка
    const totalRevenue = sales.reduce((sum, sale) => {
      return sum + parseFloat(sale.totalAmount || 0);
    }, 0);

    // Средняя рентабельность товаров
    let totalProfitability = 0;
    const productsWithCalculations = products.map(product => {
      const costPrice = parseFloat(product.costPrice) || 0;
      const sellingPrice = parseFloat(product.sellingPrice) || 0;
      const profitMargin = sellingPrice - costPrice;
      const profitability = costPrice > 0 ? (profitMargin / costPrice) * 100 : 0;
      
      totalProfitability += profitability;
      
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        costPrice,
        sellingPrice,
        profitMargin,
        profitability,
        quantity: product.quantity
      };
    });

    const averageProfitability = totalProducts > 0 ? 
      (totalProfitability / totalProducts).toFixed(2) : 0;

    // Общая прибыль
    const totalProfit = sales.reduce((sum, sale) => {
      const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
      const revenue = parseFloat(sale.totalAmount);
      return sum + (revenue - cost);
    }, 0);

    // Последние продажи
    const recentSales = sales.slice(0, 5).map(sale => ({
      id: sale.id,
      productName: sale.product?.name,
      quantity: sale.quantity,
      totalAmount: sale.totalAmount,
      saleDate: sale.saleDate,
      branchName: sale.branch?.name
    }));

    // Топ товаров по рентабельности
    const topProducts = [...productsWithCalculations]
      .sort((a, b) => b.profitability - a.profitability)
      .slice(0, 5);

    res.json({
      stats: {
        totalProducts,
        totalSales,
        totalRevenue,
        averageProfitability,
        totalProfit: totalProfit.toFixed(2)
      },
      recentSales,
      topProducts
    });

  } catch (error) {
    console.error('Error loading dashboard statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;