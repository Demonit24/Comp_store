import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, productsAPI, branchesAPI } from '../services/api';
import { 
  exportToExcel, 
  exportToPDF, 
  createSalesChart,
  prepareManagerReportData 
} from '../utils/exportUtils';

const BranchManagerPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalRevenue: 0,
    productsInStock: 0,
    branchName: 'Загрузка...',
    totalProfit: 0,
    averageSale: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [branchProducts, setBranchProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  
  const salesChartRef = useRef(null);

  useEffect(() => {
    loadManagerData();
  }, []);

  useEffect(() => {
    if (recentSales.length > 0 && salesChartRef.current) {
      setTimeout(() => {
        if (salesChartRef.current) {
          createSalesChart(recentSales, 'branchSalesChart');
        }
      }, 100);
    }
  }, [recentSales]);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      setError('');

      // Загрузка данных филиала
      const branchResponse = await branchesAPI.getById(user.branchId);
      const branchName = branchResponse.data.name;
      
      // Загрузка продаж филиала
      const salesResponse = await salesAPI.getAll({ 
        branchId: user.branchId,
        limit: 1000
      });
      
      let salesData = [];
      if (salesResponse.data && Array.isArray(salesResponse.data.sales)) {
        salesData = salesResponse.data.sales;
      } else if (Array.isArray(salesResponse.data)) {
        salesData = salesResponse.data;
      }
      
      // Загрузка товаров
      const productsResponse = await productsAPI.getAll({ limit: 1000 });
      const productsData = productsResponse.data.products || [];

      // Расчет статистики
      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesData.filter(sale => {
        if (!sale.saleDate) return false;
        const saleDate = new Date(sale.saleDate).toISOString().split('T')[0];
        return saleDate === today;
      }).length;

      const totalRevenue = salesData.reduce((sum, sale) => {
        return sum + parseFloat(sale.totalAmount || 0);
      }, 0);

      const productsInStock = productsData.reduce((sum, product) => {
        return sum + (parseInt(product.quantity) || 0);
      }, 0);

      const averageSale = salesData.length > 0 ? 
        (totalRevenue / salesData.length).toFixed(2) : 0;

      // Расчет прибыли
      const totalProfit = salesData.reduce((sum, sale) => {
        const cost = sale.product?.costPrice ? parseFloat(sale.product.costPrice) * sale.quantity : 0;
        const revenue = parseFloat(sale.totalAmount);
        return sum + (revenue - cost);
      }, 0);

      setStats({
        todaySales,
        totalRevenue,
        productsInStock,
        branchName,
        totalProfit: totalProfit.toFixed(2),
        averageSale
      });

      setRecentSales(salesData.slice(0, 50));
      setBranchProducts(productsData.slice(0, 10));

    } catch (error) {
      console.error('Error loading manager data:', error);
      setError('Не удалось загрузить данные филиала');
    } finally {
      setLoading(false);
    }
  };

  // Экспорт в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      const reportData = prepareManagerReportData(stats, stats.branchName, recentSales, branchProducts);
      exportToExcel(reportData.excelData, `Отчет_филиала_${stats.branchName}`);
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      alert('Не удалось экспортировать отчет в Excel');
    } finally {
      setExporting(false);
    }
  };

  // Экспорт в PDF
  const handleExportToPDF = async () => {
    try {
      setExporting(true);
      
      // Получаем данные для отчета
      const reportData = prepareManagerReportData(stats, stats.branchName, recentSales, branchProducts);
      
      // Создаем графики
      const charts = [];
      const chartCanvas = document.getElementById('branchSalesChart');
      
      if (chartCanvas) charts.push(chartCanvas);
      
      // Экспортируем в PDF
      await exportToPDF(
        `Отчет филиала: ${stats.branchName}`,
        reportData.pdfContent,
        charts,
        `Отчет_филиала_${stats.branchName}`
      );
      
    } catch (error) {
      console.error('Ошибка экспорта в PDF:', error);
      alert('Не удалось экспортировать отчет в PDF');
    } finally {
      setExporting(false);
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
        
        <div className="export-buttons">
          <button 
            onClick={handleExportToExcel} 
            className="btn-primary"
            disabled={exporting}
          >
            {exporting ? 'Экспорт...' : '📊 Экспорт в Excel'}
          </button>
          <button 
            onClick={handleExportToPDF} 
            className="btn-secondary"
            disabled={exporting}
          >
            {exporting ? 'Экспорт...' : '📄 Экспорт в PDF'}
          </button>
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

      {/* Дополнительная статистика */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>Общая прибыль</h3>
            <div className="stat-value">${stats.totalProfit}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Средний чек</h3>
            <div className="stat-value">${stats.averageSale}</div>
          </div>
        </div>
      </div>

      {/* График продаж */}
      <div className="charts-container">
        <div className="chart-card full-width">
          <h3>Динамика продаж филиала</h3>
          <canvas 
            id="branchSalesChart" 
            ref={salesChartRef} 
            width="800" 
            height="300"
          ></canvas>
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
                    <th>Продавец</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.slice(0, 10).map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.product?.name || 'Неизвестный товар'}</td>
                      <td>{sale.quantity}</td>
                      <td>${sale.totalAmount}</td>
                      <td>{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'Нет даты'}</td>
                      <td>{sale.user?.login || 'Неизвестно'}</td>
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
                    <th>Рентабельность</th>
                  </tr>
                </thead>
                <tbody>
                  {branchProducts.map(product => {
                    const cost = parseFloat(product.costPrice) || 0;
                    const selling = parseFloat(product.sellingPrice) || 0;
                    const profitability = cost > 0 ? ((selling - cost) / cost * 100).toFixed(2) : 0;
                    
                    return (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>
                          <span className={`category-badge category-${product.category}`}>
                            {product.category}
                          </span>
                        </td>
                        <td>${selling}</td>
                        <td>
                          <span className={`quantity ${product.quantity === 0 ? 'out-of-stock' : product.quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className={profitability >= 0 ? 'profit-positive' : 'profit-negative'}>
                          {profitability}%
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
        <button onClick={loadManagerData} className="btn-secondary">
          Обновить данные
        </button>
      </div>
    </div>
  );
};

export default BranchManagerPanel;