import React, { useState, useEffect } from 'react';
import { productsAPI, salesAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageProfitability: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загрузка статистики продуктов
      const productsResponse = await productsAPI.getAll({ limit: 1000 });
      const products = productsResponse.data.products;
      
      // Загрузка статистики продаж
      const salesResponse = await salesAPI.getAll();
      const sales = salesResponse.data;

      // Расчет общей статистики
      const totalProducts = products.length;
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      
      const totalProfitability = products.reduce((sum, product) => 
        sum + parseFloat(product.profitability || 0), 0
      );
      const averageProfitability = totalProducts > 0 ? (totalProfitability / totalProducts).toFixed(2) : 0;

      setStats({
        totalProducts,
        totalSales,
        totalRevenue,
        averageProfitability
      });

      // Последние продажи
      setRecentSales(sales.slice(0, 5));

      // Топ товаров по рентабельности
      const profitableProducts = [...products]
        .sort((a, b) => parseFloat(b.profitability) - parseFloat(a.profitability))
        .slice(0, 5);
      
      setTopProducts(profitableProducts);

    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
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
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.product?.name}</td>
                      <td>{sale.quantity}</td>
                      <td>${sale.totalAmount}</td>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
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
                    <th>Рентабельность</th>
                    <th>Маржа</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <span className={`category-badge category-${product.category}`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="profit-positive">{product.profitability}%</td>
                      <td className="profit-positive">${product.profitMargin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">Нет данных о товарах</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;