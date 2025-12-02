import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';

const router = express.Router();

// Генерация PDF отчета для главного бухгалтера
router.get('/enterprise/pdf', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product, Branch } = req.models;
    
    // Проверка прав
    if (req.user.role !== 'admin' && req.user.role !== 'chief_accountant') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    console.log('Generating enterprise report...');

    // Получаем данные за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Получаем все продажи
    const sales = await Sale.findAll({
      where: {
        saleDate: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'costPrice']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    // Получаем все товары
    const products = await Product.findAll();
    
    // Получаем все филиалы
    const branches = await Branch.findAll();

    // Рассчитываем статистику
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalProfit = sales.reduce((sum, sale) => {
      const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
      return sum + (parseFloat(sale.totalAmount) - cost);
    }, 0);

    const avgProfitability = products.length > 0 ? 
      products.reduce((sum, product) => {
        const cost = parseFloat(product.costPrice);
        const selling = parseFloat(product.sellingPrice);
        return cost > 0 ? sum + ((selling - cost) / cost * 100) : sum;
      }, 0) / products.length : 0;

    // Группируем данные по филиалам
    const branchStats = branches.map(branch => {
      const branchSales = sales.filter(sale => sale.branchId === branch.id);
      const branchRevenue = branchSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const branchProfit = branchSales.reduce((sum, sale) => {
        const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
        return sum + (parseFloat(sale.totalAmount) - cost);
      }, 0);
      
      return {
        name: branch.name,
        salesCount: branchSales.length,
        revenue: branchRevenue,
        profit: branchProfit,
        profitability: branchRevenue > 0 ? (branchProfit / branchRevenue * 100) : 0
      };
    });

    // Группируем по категориям
    const categoryStats = {};
    products.forEach(product => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = {
          count: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      
      const productSales = sales.filter(sale => sale.productId === product.id);
      const productRevenue = productSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const productProfit = productSales.reduce((sum, sale) => {
        const cost = parseFloat(product.costPrice) * sale.quantity;
        return sum + (parseFloat(sale.totalAmount) - cost);
      }, 0);
      
      categoryStats[product.category].count++;
      categoryStats[product.category].totalRevenue += productRevenue;
      categoryStats[product.category].totalProfit += productProfit;
    });

    // Создаем PDF документ
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Устанавливаем заголовки для ответа
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="enterprise_report.pdf"');

    // Пайпим документ в ответ
    doc.pipe(res);

    // Заголовок отчета
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('ОТЧЕТ ПО РЕНТАБЕЛЬНОСТИ ПРЕДПРИЯТИЯ', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(12)
       .text(`Период: последние 30 дней (с ${thirtyDaysAgo.toLocaleDateString('ru-RU')})`, { align: 'center' });
    
    doc.moveDown(2);

    // Основная статистика
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ОБЩАЯ СТАТИСТИКА', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Всего филиалов: ${branches.length}`);
    doc.text(`Всего товаров: ${products.length}`);
    doc.text(`Всего продаж: ${sales.length}`);
    doc.text(`Общая выручка: $${totalRevenue.toFixed(2)}`);
    doc.text(`Общая прибыль: $${totalProfit.toFixed(2)}`);
    doc.text(`Средняя рентабельность: ${avgProfitability.toFixed(2)}%`);
    
    doc.moveDown(2);

    // Статистика по филиалам
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('СТАТИСТИКА ПО ФИЛИАЛАМ', { underline: true });
    
    doc.moveDown();
    
    branchStats.forEach((branch, index) => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${branch.name}`);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`   Продаж: ${branch.salesCount}`)
         .text(`   Выручка: $${branch.revenue.toFixed(2)}`)
         .text(`   Прибыль: $${branch.profit.toFixed(2)}`)
         .text(`   Рентабельность: ${branch.profitability.toFixed(2)}%`);
      
      doc.moveDown(0.5);
    });

    // Статистика по категориям
    doc.addPage();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('СТАТИСТИКА ПО КАТЕГОРИЯМ ТОВАРОВ', { underline: true });
    
    doc.moveDown();
    
    Object.entries(categoryStats).forEach(([category, stats], index) => {
      const profitability = stats.totalRevenue > 0 ? 
        (stats.totalProfit / stats.totalRevenue * 100) : 0;
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${category}`);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`   Количество товаров: ${stats.count}`)
         .text(`   Выручка: $${stats.totalRevenue.toFixed(2)}`)
         .text(`   Прибыль: $${stats.totalProfit.toFixed(2)}`)
         .text(`   Рентабельность: ${profitability.toFixed(2)}%`);
      
      doc.moveDown(0.5);
    });

    // Топ товаров по рентабельности
    doc.addPage();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ТОП-10 САМЫХ РЕНТАБЕЛЬНЫХ ТОВАРОВ', { underline: true });
    
    doc.moveDown();
    
    const productsWithProfitability = products.map(product => {
      const cost = parseFloat(product.costPrice);
      const selling = parseFloat(product.sellingPrice);
      const profitability = cost > 0 ? ((selling - cost) / cost * 100) : 0;
      
      return {
        ...product.toJSON(),
        profitability
      };
    });
    
    const topProducts = productsWithProfitability
      .sort((a, b) => b.profitability - a.profitability)
      .slice(0, 10);
    
    topProducts.forEach((product, index) => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${product.name}`);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(`   Категория: ${product.category}`)
         .text(`   Себестоимость: $${product.costPrice}`)
         .text(`   Цена продажи: $${product.sellingPrice}`)
         .text(`   Рентабельность: ${product.profitability.toFixed(2)}%`)
         .text(`   В наличии: ${product.quantity} шт.`);
      
      doc.moveDown(0.5);
    });

    // Заключение
    doc.addPage();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ЗАКЛЮЧЕНИЕ', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .text('Анализ рентабельности предприятия показывает:')
       .moveDown(0.5);
    
    // Находим самый прибыльный филиал
    const mostProfitableBranch = [...branchStats].sort((a, b) => b.profit - a.profit)[0];
    const mostProfitableCategory = Object.entries(categoryStats)
      .sort(([ , a], [ , b]) => b.totalProfit - a.totalProfit)[0];
    
    doc.fontSize(11)
       .text(`• Самый прибыльный филиал: ${mostProfitableBranch.name} ($${mostProfitableBranch.profit.toFixed(2)})`)
       .text(`• Самая рентабельная категория: ${mostProfitableCategory[0]} ($${mostProfitableCategory[1].totalProfit.toFixed(2)})`)
       .text(`• Средняя рентабельность по всем товарам: ${avgProfitability.toFixed(2)}%`)
       .moveDown();
    
    doc.text('Рекомендации:')
       .moveDown(0.5);
    
    // Простые рекомендации
    doc.fontSize(11)
       .text('1. Увеличить поставки наиболее рентабельных товаров')
       .text('2. Провести анализ работы менее рентабельных филиалов')
       .text('3. Рассмотреть возможность оптимизации себестоимости')
       .text('4. Увеличить продажи через наиболее эффективные каналы');

    // Футер
    doc.moveDown(2);
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text('Отчет сгенерирован автоматически системой управления рентабельностью', { align: 'center' });

    // Завершаем документ
    doc.end();

  } catch (error) {
    console.error('Error generating enterprise PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

// Генерация PDF отчета для менеджера филиала
router.get('/branch/pdf/:branchId', authenticateToken, async (req, res) => {
  try {
    const { Sale, Product, Branch } = req.models;
    const { branchId } = req.params;
    
    console.log('Generating branch report for:', branchId);

    // Проверка прав
    if (req.user.role === 'branch_manager' && parseInt(branchId) !== parseInt(req.user.branchId)) {
      return res.status(403).json({ message: 'Доступ запрещен к отчету другого филиала' });
    }

    // Получаем данные филиала
    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Филиал не найден' });
    }

    // Получаем продажи за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.findAll({
      where: {
        branchId,
        saleDate: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'costPrice', 'sellingPrice']
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    // Получаем товары, которые есть в продажах филиала
    const productIds = [...new Set(sales.map(sale => sale.productId))];
    const products = await Product.findAll({
      where: {
        id: productIds
      }
    });

    // Рассчитываем статистику
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalProfit = sales.reduce((sum, sale) => {
      const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
      return sum + (parseFloat(sale.totalAmount) - cost);
    }, 0);

    // Продажи по дням
    const salesByDay = {};
    sales.forEach(sale => {
      const date = new Date(sale.saleDate).toLocaleDateString('ru-RU');
      if (!salesByDay[date]) {
        salesByDay[date] = {
          revenue: 0,
          profit: 0,
          count: 0
        };
      }
      const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
      salesByDay[date].revenue += parseFloat(sale.totalAmount);
      salesByDay[date].profit += parseFloat(sale.totalAmount) - cost;
      salesByDay[date].count++;
    });

    // Продажи по товарам
    const salesByProduct = {};
    sales.forEach(sale => {
      if (!salesByProduct[sale.productId]) {
        salesByProduct[sale.productId] = {
          name: sale.product?.name,
          revenue: 0,
          quantity: 0,
          profit: 0
        };
      }
      const cost = sale.product ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
      salesByProduct[sale.productId].revenue += parseFloat(sale.totalAmount);
      salesByProduct[sale.productId].quantity += sale.quantity;
      salesByProduct[sale.productId].profit += parseFloat(sale.totalAmount) - cost;
    });

    // Создаем PDF документ
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="branch_${branch.name}_report.pdf"`);
    
    doc.pipe(res);

    // Заголовок отчета
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(`ОТЧЕТ ПО ФИЛИАЛУ: ${branch.name.toUpperCase()}`, { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(12)
       .text(`Адрес: ${branch.address?.street || 'Не указан'}, ${branch.address?.city || 'Не указан'}`, { align: 'center' });
    
    if (branch.phone) {
      doc.text(`Телефон: ${branch.phone}`, { align: 'center' });
    }
    
    if (branch.email) {
      doc.text(`Email: ${branch.email}`, { align: 'center' });
    }
    
    doc.moveDown(2);

    // Основная статистика
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ОСНОВНЫЕ ПОКАЗАТЕЛИ', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Период анализа: последние 30 дней`)
       .text(`Всего продаж: ${sales.length}`)
       .text(`Общая выручка: $${totalRevenue.toFixed(2)}`)
       .text(`Общая прибыль: $${totalProfit.toFixed(2)}`)
       .text(`Средний чек: $${sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : 0}`)
       .text(`Рентабельность: ${totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(2) : 0}%`);
    
    doc.moveDown(2);

    // Продажи по дням
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ПРОДАЖИ ПО ДНЯМ', { underline: true });
    
    doc.moveDown();
    
    const sortedDays = Object.entries(salesByDay)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
    
    sortedDays.slice(-10).forEach(([date, data]) => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(date);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(`   Продаж: ${data.count}`)
         .text(`   Выручка: $${data.revenue.toFixed(2)}`)
         .text(`   Прибыль: $${data.profit.toFixed(2)}`)
         .text(`   Рентабельность: ${data.revenue > 0 ? (data.profit / data.revenue * 100).toFixed(2) : 0}%`);
      
      doc.moveDown(0.5);
    });

    doc.addPage();

    // Топ товаров по продажам
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ТОП ТОВАРОВ ПО ПРОДАЖАМ', { underline: true });
    
    doc.moveDown();
    
    const sortedProducts = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    sortedProducts.forEach((product, index) => {
      const profitability = product.revenue > 0 ? (product.profit / product.revenue * 100) : 0;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${product.name}`);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(`   Продано: ${product.quantity} шт.`)
         .text(`   Выручка: $${product.revenue.toFixed(2)}`)
         .text(`   Прибыль: $${product.profit.toFixed(2)}`)
         .text(`   Рентабельность: ${profitability.toFixed(2)}%`);
      
      doc.moveDown(0.5);
    });

    // Анализ и рекомендации
    doc.addPage();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('АНАЛИЗ И РЕКОМЕНДАЦИИ', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .font('Helvetica')
       .text('На основе анализа продаж за последние 30 дней:')
       .moveDown(0.5);
    
    // Находим самый продаваемый товар
    const topProduct = sortedProducts[0];
    const avgDailyRevenue = totalRevenue / 30;
    
    doc.fontSize(11)
       .text(`• Самый продаваемый товар: ${topProduct?.name || 'Нет данных'} ($${topProduct?.revenue.toFixed(2)})`)
       .text(`• Средняя дневная выручка: $${avgDailyRevenue.toFixed(2)}`)
       .text(`• Средняя рентабельность: ${totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(2) : 0}%`)
       .moveDown();
    
    doc.text('Рекомендации для филиала:')
       .moveDown(0.5);
    
    doc.fontSize(11)
       .text('1. Сосредоточиться на продвижении наиболее рентабельных товаров')
       .text('2. Увеличить остатки самых продаваемых товаров')
       .text('3. Провести анализ дней с низкой выручкой')
       .text('4. Рассмотреть возможность акций на менее продаваемые товары')
       .text('5. Оптимизировать график работы персонала под пиковые часы продаж');

    // Футер
    doc.moveDown(2);
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text('Отчет сгенерирован системой управления рентабельностью', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generating branch PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;