import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, productsAPI, branchesAPI } from '../services/api';

const BranchManagerPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalRevenue: 0,
    productsInStock: 0,
    branchName: 'Загрузка...'
  });
  const [recentSales, setRecentSales] = useState([]);
  const [branchProducts, setBranchProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading manager data for branch:', user.branchId);

      // Загружаем данные филиала менеджера
      let branchName = 'Ваш филиал';
      try {
        const branchResponse = await branchesAPI.getById(user.branchId);
        branchName = branchResponse.data.name;
        console.log('Branch loaded:', branchName);
      } catch (branchError) {
        console.error('Error loading branch:', branchError);
      }
      
      // Загружаем продажи только этого филиала
      let salesData = [];
      try {
        const salesResponse = await salesAPI.getAll({ 
          branchId: user.branchId,
          limit: 100
        });
        
        // Обрабатываем разные форматы ответа
        if (salesResponse.data && Array.isArray(salesResponse.data.sales)) {
          salesData = salesResponse.data.sales;
        } else if (Array.isArray(salesResponse.data)) {
          salesData = salesResponse.data;
        }
        console.log('Sales loaded:', salesData.length);
      } catch (salesError) {
        console.error('Error loading sales:', salesError);
        setError('Не удалось загрузить продажи');
      }
      
      // Загружаем все товары для отображения
      let productsData = [];
      try {
        const productsResponse = await productsAPI.getAll({ limit: 1000 });
        productsData = productsResponse.data.products || [];
        console.log('Products loaded:', productsData.length);
      } catch (productsError) {
        console.error('Error loading products:', productsError);
      }

      // Рассчитываем статистику
      const today = new Date().toISOString().split('T')[0];
      console.log('Today date:', today);

      // Продажи за сегодня
      const todaySales = salesData.filter(sale => {
        if (!sale.saleDate) return false;
        const saleDate = new Date(sale.saleDate).toISOString().split('T')[0];
        return saleDate === today;
      }).length;

      console.log('Today sales count:', todaySales);

      // Общая выручка по всем продажам филиала
      const totalRevenue = salesData.reduce((sum, sale) => {
        return sum + parseFloat(sale.totalAmount || 0);
      }, 0);

      console.log('Total revenue:', totalRevenue);

      // Товары в наличии (сумма всех quantity)
      const productsInStock = productsData.reduce((sum, product) => {
        return sum + (parseInt(product.quantity) || 0);
      }, 0);

      console.log('Products in stock:', productsInStock);

      setStats({
        todaySales,
        totalRevenue,
        productsInStock,
        branchName
      });

      // Последние 5 продаж
      setRecentSales(salesData.slice(0, 5));
      
      // Последние 5 товаров
      setBranchProducts(productsData.slice(0, 5));

    } catch (error) {
      console.error('Error loading manager data:', error);
      setError('Не удалось загрузить данные филиала');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка данных филиала...</div>;
  }

  return (
    <div className="branch-manager-panel">
      <div className="page-header">
        <div className="header-content">
          <h1>Панель менеджера филиала</h1>
          <p>Управление продажами и товарами филиала: <strong>{stats.branchName}</strong></p>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>

      {/* Статистика филиала */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>Продажи сегодня</h3>
            <div className="stat-value">{stats.todaySales}</div>
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
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Товары в наличии</h3>
            <div className="stat-value">{stats.productsInStock}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>Филиал</h3>
            <div className="stat-value">{stats.branchName}</div>
          </div>
        </div>
      </div>

      <div className="manager-content">
        {/* Последние продажи */}
        <div className="content-section">
          <div className="section-header">
            <h3>Последние продажи</h3>
            <a href="/branch-sales" className="btn-primary">Все продажи</a>
          </div>
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
                      <td>{sale.product?.name || 'Неизвестный товар'}</td>
                      <td>{sale.quantity}</td>
                      <td>${sale.totalAmount}</td>
                      <td>{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'Нет даты'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">Нет данных о продажах</p>
            )}
          </div>
        </div>

        {/* Популярные товары */}
        <div className="content-section">
          <div className="section-header">
            <h3>Товары в наличии</h3>
            <a href="/products" className="btn-primary">Все товары</a>
          </div>
          <div className="card">
            {branchProducts.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Цена</th>
                    <th>В наличии</th>
                  </tr>
                </thead>
                <tbody>
                  {branchProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <span className={`category-badge category-${product.category}`}>
                          {product.category}
                        </span>
                      </td>
                      <td>${product.sellingPrice}</td>
                      <td>
                        <span className={`quantity ${product.quantity === 0 ? 'out-of-stock' : product.quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                          {product.quantity}
                        </span>
                      </td>
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

      {/* Кнопка обновления данных */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={loadManagerData} className="btn-secondary">
          Обновить данные
        </button>
      </div>
    </div>
  );
};

export default BranchManagerPanel;