import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, salesAPI } from '../services/api';
import { 
  exportToExcel, 
  exportToPDF, 
  createProfitabilityChart, 
  createSalesChart,
  prepareAccountantReportData 
} from '../utils/exportUtils';

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
  const [exporting, setExporting] = useState(false);
  
  const profitabilityChartRef = useRef(null);
  const salesChartRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Инициализация графиков после загрузки данных
  useEffect(() => {
    if (topProducts.length > 0 && profitabilityChartRef.current) {
      setTimeout(() => {
        if (profitabilityChartRef.current) {
          createProfitabilityChart(topProducts, 'profitabilityChart');
        }
      }, 100);
    }

    if (recentSales.length > 0 && salesChartRef.current) {
      setTimeout(() => {
        if (salesChartRef.current) {
          createSalesChart(recentSales, 'salesChart');
        }
      }, 100);
    }
  }, [topProducts, recentSales]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Загрузка продуктов
      const productsResponse = await productsAPI.getAll({ limit: 1000 });
      const products = productsResponse.data.products || [];
      
      // Загрузка продаж
      const salesResponse = await salesAPI.getAll({ limit: 1000 });
      let sales = [];
      
      if (salesResponse.data && salesResponse.data.sales) {
        sales = salesResponse.data.sales;
      } else if (Array.isArray(salesResponse.data)) {
        sales = salesResponse.data;
      }
      
      // Расчет статистики
      const totalProducts = products.length;
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => {
        return sum + (parseFloat(sale.totalAmount) || 0);
      }, 0);

      // Расчет рентабельности
      let totalProfitability = 0;
      let validProducts = 0;
      
      const productsWithCalculations = products.map(product => {
        const cost = parseFloat(product.costPrice) || 0;
        const selling = parseFloat(product.sellingPrice) || 0;
        const profitMargin = selling - cost;
        let profitability = 0;
        
        if (cost > 0) {
          profitability = ((selling - cost) / cost) * 100;
          totalProfitability += profitability;
          validProducts++;
        }
        
        return {
          ...product,
          calculatedProfitMargin: profitMargin,
          calculatedProfitability: profitability
        };
      });

      const averageProfitability = validProducts > 0 ? 
        (totalProfitability / validProducts).toFixed(2) : 0;

      // Расчет прибыли
      const totalProfit = productsWithCalculations.reduce((sum, product) => {
        const quantitySold = sales
          .filter(sale => sale.productId === product.id)
          .reduce((qty, sale) => qty + (parseInt(sale.quantity) || 0), 0);
        
        return sum + (product.calculatedProfitMargin * quantitySold);
      }, 0);

      setStats({
        totalProducts,
        totalSales,
        totalRevenue,
        averageProfitability,
        totalProfit: totalProfit.toFixed(2)
      });

      setRecentSales(sales.slice(0, 20));
      setTopProducts(productsWithCalculations.sort((a, b) => b.calculatedProfitability - a.calculatedProfitability).slice(0, 10));

    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
      setError('Не удалось загрузить данные. Проверьте консоль для подробностей.');
    } finally {
      setLoading(false);
    }
  };

  // Экспорт в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      const reportData = prepareAccountantReportData(stats, topProducts, recentSales);
      exportToExcel(reportData.excelData, 'Отчет_рентабельности_предприятия');
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
      const reportData = prepareAccountantReportData(stats, topProducts, recentSales);
      
      // Создаем графики
      const charts = [];
      const chart1Canvas = document.getElementById('profitabilityChart');
      const chart2Canvas = document.getElementById('salesChart');
      
      if (chart1Canvas) charts.push(chart1Canvas);
      if (chart2Canvas) charts.push(chart2Canvas);
      
      // Экспортируем в PDF
      await exportToPDF(
        'Отчет о рентабельности предприятия',
        reportData.pdfContent,
        charts,
        'Отчет_рентабельности_предприятия'
      );
      
    } catch (error) {
      console.error('Ошибка экспорта в PDF:', error);
      alert('Не удалось экспортировать отчет в PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка данных дашборда...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Дашборд рентабельности</h1>
          <p>Обзор эффективности бизнеса компьютерной техники</p>
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

      {/* Графики */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Топ 10 товаров по рентабельности</h3>
          <canvas 
            id="profitabilityChart" 
            ref={profitabilityChartRef} 
            width="400" 
            height="200"
          ></canvas>
        </div>
        
        <div className="chart-card">
          <h3>Динамика выручки</h3>
          <canvas 
            id="salesChart" 
            ref={salesChartRef} 
            width="400" 
            height="200"
          ></canvas>
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