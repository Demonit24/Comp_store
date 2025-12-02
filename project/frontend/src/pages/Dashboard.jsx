import React, { useState, useEffect } from 'react';
import { productsAPI, salesAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageProfitability: 0,
    totalProfit: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Начало загрузки данных для дашборда...');

      // Загрузка продуктов с вычисляемыми полями
      let products = [];
      try {
        const productsResponse = await productsAPI.getAll({ 
          limit: 1000,
          page: 1
        });
        console.log('Ответ от productsAPI:', productsResponse);
        
        if (productsResponse.data && productsResponse.data.products) {
          products = productsResponse.data.products;
        } else if (Array.isArray(productsResponse.data)) {
          products = productsResponse.data;
        }
        console.log(`Загружено товаров: ${products.length}`);
      } catch (productsError) {
        console.error('Ошибка загрузки товаров:', productsError);
        throw new Error('Не удалось загрузить данные о товарах');
      }

      // Загрузка продаж
      let sales = [];
      try {
        const salesResponse = await salesAPI.getAll({
          limit: 1000,
          page: 1,
          sortBy: 'sale_date',
          sortOrder: 'DESC'
        });
        console.log('Ответ от salesAPI:', salesResponse);
        
        if (salesResponse.data && salesResponse.data.sales) {
          sales = salesResponse.data.sales;
        } else if (Array.isArray(salesResponse.data)) {
          sales = salesResponse.data;
        }
        console.log(`Загружено продаж: ${sales.length}`);
      } catch (salesError) {
        console.error('Ошибка загрузки продаж:', salesError);
        throw new Error('Не удалось загрузить данные о продажах');
      }

      // Рассчитываем статистику
      console.log('Начало расчета статистики...');
      
      const totalProducts = products.length;
      const totalSales = sales.length;
      
      // Общая выручка
      const totalRevenue = sales.reduce((sum, sale) => {
        const amount = parseFloat(sale.totalAmount) || 0;
        return sum + amount;
      }, 0);
      console.log('Общая выручка:', totalRevenue);

      // Рассчитываем рентабельность для каждого продукта
      const productsWithProfitability = products.map(product => {
        const costPrice = parseFloat(product.costPrice) || 0;
        const sellingPrice = parseFloat(product.sellingPrice) || 0;
        const profitMargin = sellingPrice - costPrice;
        const profitability = costPrice > 0 ? (profitMargin / costPrice) * 100 : 0;
        
        return {
          ...product,
          calculatedProfitMargin: profitMargin,
          calculatedProfitability: profitability
        };
      });

      // Средняя рентабельность
      const totalProfitability = productsWithProfitability.reduce((sum, product) => {
        return sum + (product.calculatedProfitability || 0);
      }, 0);
      
      const averageProfitability = totalProducts > 0 ? 
        (totalProfitability / totalProducts).toFixed(2) : 0;

      // Общая прибыль (выручка - себестоимость)
      const totalProfit = productsWithProfitability.reduce((sum, product) => {
        const quantitySold = sales
          .filter(sale => sale.productId === product.id)
          .reduce((qty, sale) => qty + (parseInt(sale.quantity) || 0), 0);
        
        const profitPerUnit = product.calculatedProfitMargin || 0;
        return sum + (profitPerUnit * quantitySold);
      }, 0);

      console.log('Расчет статистики завершен:', {
        totalProducts,
        totalSales,
        totalRevenue,
        averageProfitability,
        totalProfit
      });

      setStats({
        totalProducts,
        totalSales,
        totalRevenue,
        averageProfitability,
        totalProfit: totalProfit.toFixed(2)
      });

      // Последние продажи (5 последних)
      const lastSales = sales.slice(0, 5);
      console.log('Последние продажи:', lastSales.length);
      setRecentSales(lastSales);

      // Топ товаров по рентабельности
      const sortedByProfitability = [...productsWithProfitability]
        .sort((a, b) => {
          const profitabilityA = a.calculatedProfitability || 0;
          const profitabilityB = b.calculatedProfitability || 0;
          return profitabilityB - profitabilityA;
        })
        .slice(0, 5);
      
      console.log('Топ товаров по рентабельности:', sortedByProfitability.length);
      setTopProducts(sortedByProfitability);

    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
      setError(error.message || 'Ошибка при загрузке данных дашборда');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка дашборда...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Дашборд рентабельности</h1>
        <p>Обзор эффективности бизнеса компьютерной техники</p>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Всего товаров</h3>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>Всего продаж</h3>
            <div className="stat-value">{stats.totalSales}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Общая выручка</h3>
            <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>Средняя рентабельность</h3>
            <div className="stat-value">{stats.averageProfitability}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>Общая прибыль</h3>
            <div className="stat-value">${stats.totalProfit}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>Последние продажи</h3>
          <div className="card">
            {recentSales.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Количество</th>
                    <th>Сумма</th>
                    <th>Дата</th>
                    <th>Филиал</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.product?.name || 'Неизвестный товар'}</td>
                      <td>{sale.quantity}</td>
                      <td>${sale.totalAmount}</td>
                      <td>{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'Нет даты'}</td>
                      <td>{sale.branch?.name || 'Неизвестный филиал'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">Нет данных о продажах</p>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Самые рентабельные товары</h3>
          <div className="card">
            {topProducts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Категория</th>
                    <th>Себестоимость</th>
                    <th>Цена продажи</th>
                    <th>Рентабельность</th>
                    <th>Маржа</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(product => {
                    const profitability = product.calculatedProfitability || 0;
                    const profitMargin = product.calculatedProfitMargin || 0;
                    const costPrice = parseFloat(product.costPrice) || 0;
                    const sellingPrice = parseFloat(product.sellingPrice) || 0;
                    
                    return (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>
                          <span className={`category-badge category-${product.category}`}>
                            {product.category}
                          </span>
                        </td>
                        <td>${costPrice.toFixed(2)}</td>
                        <td>${sellingPrice.toFixed(2)}</td>
                        <td className={profitability >= 0 ? 'profit-positive' : 'profit-negative'}>
                          {profitability.toFixed(2)}%
                        </td>
                        <td className={profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}>
                          ${profitMargin.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">Нет данных о товарах</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={loadDashboardData} className="btn-secondary">
          Обновить данные
        </button>
      </div>
    </div>
  );
};

export default Dashboard;