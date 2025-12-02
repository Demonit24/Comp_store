import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, productsAPI, branchesAPI } from '../services/api';
import ReportGenerator from '../components/ReportGenerator';
import { useNavigate } from 'react-router-dom';

const EnterpriseReportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Проверяем права доступа
    if (user.role !== 'admin' && user.role !== 'chief_accountant') {
      navigate('/dashboard');
      return;
    }

    loadReportData();
  }, [user]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Загрузка данных для отчета предприятия...');

      // Загружаем данные параллельно для оптимизации
      const [salesResponse, productsResponse, branchesResponse] = await Promise.all([
        salesAPI.getAll({ limit: 1000 }),
        productsAPI.getAll({ limit: 1000 }),
        branchesAPI.getAll()
      ]);

      // Обрабатываем продажи
      let sales = [];
      if (salesResponse.data && salesResponse.data.sales) {
        sales = salesResponse.data.sales;
      } else if (Array.isArray(salesResponse.data)) {
        sales = salesResponse.data;
      }

      // Обрабатываем товары
      const products = productsResponse.data.products || [];
      
      // Обрабатываем филиалы
      const branches = branchesResponse.data || [];

      // Рассчитываем статистику
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0);
      const totalProfit = sales.reduce((sum, sale) => {
        const cost = sale.product ? parseFloat(sale.product.costPrice || 0) * sale.quantity : 0;
        return sum + (parseFloat(sale.totalAmount || 0) - cost);
      }, 0);

      const totalSales = sales.length;

      // Продажи по дням (последние 30 дней)
      const salesByDayMap = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Инициализируем все дни
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toLocaleDateString('ru-RU');
        salesByDayMap[dateStr] = {
          date: dateStr,
          revenue: 0,
          profit: 0,
          count: 0
        };
      }

      // Заполняем данными
      sales.forEach(sale => {
        const saleDate = new Date(sale.saleDate);
        if (saleDate >= thirtyDaysAgo) {
          const dateStr = saleDate.toLocaleDateString('ru-RU');
          if (salesByDayMap[dateStr]) {
            const cost = sale.product ? parseFloat(sale.product.costPrice || 0) * sale.quantity : 0;
            salesByDayMap[dateStr].revenue += parseFloat(sale.totalAmount || 0);
            salesByDayMap[dateStr].profit += (parseFloat(sale.totalAmount || 0) - cost);
            salesByDayMap[dateStr].count++;
          }
        }
      });

      const salesByDay = Object.values(salesByDayMap);

      // Статистика по филиалам
      const branchStats = branches.map(branch => {
        const branchSales = sales.filter(sale => sale.branchId === branch.id);
        const branchRevenue = branchSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0);
        const branchProfit = branchSales.reduce((sum, sale) => {
          const cost = sale.product ? parseFloat(sale.product.costPrice || 0) * sale.quantity : 0;
          return sum + (parseFloat(sale.totalAmount || 0) - cost);
        }, 0);
        
        return {
          name: branch.name,
          revenue: branchRevenue,
          profit: branchProfit,
          salesCount: branchSales.length,
          profitability: branchRevenue > 0 ? (branchProfit / branchRevenue * 100) : 0
        };
      });

      // Статистика по категориям
      const categoryStatsMap = {};
      products.forEach(product => {
        const category = product.category || 'Без категории';
        if (!categoryStatsMap[category]) {
          categoryStatsMap[category] = 0;
        }
        
        const productSales = sales.filter(sale => sale.productId === product.id);
        const productRevenue = productSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0);
        categoryStatsMap[category] += productRevenue;
      });

      const categoryStats = Object.entries(categoryStatsMap).map(([name, value]) => ({
        name,
        value
      }));

      // Топ товаров по рентабельности
      const topProducts = products
        .map(product => {
          const cost = parseFloat(product.costPrice || 0);
          const selling = parseFloat(product.sellingPrice || 0);
          const profitability = cost > 0 ? ((selling - cost) / cost * 100) : 0;
          
          return {
            name: product.name,
            category: product.category,
            costPrice: cost,
            sellingPrice: selling,
            profitability: profitability,
            quantity: product.quantity
          };
        })
        .sort((a, b) => b.profitability - a.profitability)
        .slice(0, 10);

      // Формируем данные для отчета
      const reportData = {
        totalRevenue,
        totalProfit,
        totalSales,
        profitability: totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0,
        salesByDay,
        branchStats,
        categoryStats,
        topProducts
      };

      console.log('Данные для отчета загружены:', reportData);
      setReportData(reportData);

    } catch (error) {
      console.error('Ошибка загрузки данных отчета:', error);
      setError('Не удалось загрузить данные для отчета');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Загрузка данных для отчета...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadReportData} className="btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Генерация отчета предприятия</h1>
          <p>Просмотр и экспорт аналитики рентабельности всего предприятия</p>
        </div>
        <button 
          onClick={() => navigate('/chief-accountant')} 
          className="btn-secondary"
        >
          ← Назад к дашборду
        </button>
      </div>

      {reportData && (
        <ReportGenerator 
          data={reportData} 
          type="enterprise" 
        />
      )}
    </div>
  );
};

export default EnterpriseReportPage;