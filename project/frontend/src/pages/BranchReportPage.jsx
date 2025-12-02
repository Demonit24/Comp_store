import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, productsAPI, branchesAPI } from '../services/api';
import ReportGenerator from '../components/ReportGenerator';
import { useNavigate } from 'react-router-dom';

const BranchReportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);

  useEffect(() => {
    // Проверяем права доступа
    if (user.role !== 'admin' && user.role !== 'branch_manager' && user.role !== 'chief_accountant') {
      navigate('/dashboard');
      return;
    }

    loadReportData();
  }, [user]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Загрузка данных для отчета филиала...');
      console.log('User branchId:', user.branchId); // Добавьте для отладки
      // Загружаем информацию о филиале
      let branchId = user.branchId;
      let branchName = 'Ваш филиал';
      
      if (user.role === 'branch_manager') {
        if (!branchId) {
          setError('У вашего аккаунта не указан филиал. Обратитесь к администратору.');
          setLoading(false);
          return;
        }
        
        // Для менеджера - его филиал
        try {
            const branchResponse = await branchesAPI.getById(branchId);
            if (branchResponse.data) {
              branchName = branchResponse.data.name;
              setBranchInfo(branchResponse.data);
            } else {
              setError('Информация о филиале не найдена');
              setLoading(false);
              return;
            }
          } catch (branchError) {
            console.error('Ошибка загрузки филиала:', branchError);
            setError('Не удалось загрузить информацию о филиале');
            setLoading(false);
            return;
          }
      } else {
        // Для админа и бухгалтера показываем первый филиал или выбираем другой
        try {
          const branchesResponse = await branchesAPI.getAll();
          if (branchesResponse.data && branchesResponse.data.length > 0) {
            branchId = branchesResponse.data[0].id;
            branchName = branchesResponse.data[0].name;
            setBranchInfo(branchesResponse.data[0]);
          } else {
            setError('В системе нет филиалов');
            setLoading(false);
            return;
          }
        } catch (branchesError) {
          console.error('Ошибка загрузки списка филиалов:', branchesError);
          setError('Не удалось загрузить список филиалов');
          setLoading(false);
          return;
        }
      }

      // Загружаем продажи филиала
      try {
        const salesResponse = await salesAPI.getAll({ 
          branchId: branchId,
          limit: 1000 
        });
        
        // Проверяем ответ
        if (!salesResponse || !salesResponse.data) {
          throw new Error('Не удалось загрузить данные о продажах');
        }
        
        // ... обработка продаж
      } catch (salesError) {
        console.error('Ошибка загрузки продаж:', salesError);
        setError('Не удалось загрузить данные о продажах филиала');
        setLoading(false);
        return;
      }

      // Загружаем товары
      const productsResponse = await productsAPI.getAll({ limit: 1000 });

      // Обрабатываем продажи
      let sales = [];
      if (salesResponse.data && salesResponse.data.sales) {
        sales = salesResponse.data.sales;
      } else if (Array.isArray(salesResponse.data)) {
        sales = salesResponse.data;
      }

      // Обрабатываем товары
      const products = productsResponse.data.products || [];

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

      // Топ товаров по продажам в филиале
      const productSalesMap = {};
      sales.forEach(sale => {
        if (!productSalesMap[sale.productId]) {
          productSalesMap[sale.productId] = {
            name: sale.product?.name || 'Неизвестный товар',
            revenue: 0,
            quantity: 0,
            profit: 0
          };
        }
        const cost = sale.product ? parseFloat(sale.product.costPrice || 0) * sale.quantity : 0;
        productSalesMap[sale.productId].revenue += parseFloat(sale.totalAmount || 0);
        productSalesMap[sale.productId].quantity += sale.quantity;
        productSalesMap[sale.productId].profit += (parseFloat(sale.totalAmount || 0) - cost);
      });

      const topProducts = Object.values(productSalesMap)
        .map(product => ({
          name: product.name,
          revenue: product.revenue,
          quantity: product.quantity,
          profit: product.profit,
          profitability: product.revenue > 0 ? (product.profit / product.revenue * 100) : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Формируем данные для отчета
      const reportData = {
        totalRevenue,
        totalProfit,
        totalSales,
        profitability: totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0,
        salesByDay,
        categoryStats,
        topProducts
      };

      console.log('Данные для отчета филиала загружены:', reportData);
      setReportData(reportData);

    } catch (error) {
      console.error('Ошибка загрузки данных отчета филиала:', error);
      setError('Не удалось загрузить данные для отчета филиала');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Загрузка данных для отчета филиала...</div>
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
          <h1>Генерация отчета филиала</h1>
          <p>
            Просмотр и экспорт аналитики рентабельности филиала: 
            <strong> {branchInfo?.name || 'Ваш филиал'}</strong>
          </p>
          {branchInfo && (
            <div className="branch-info">
              {branchInfo.address && (
                <span>Адрес: {branchInfo.address.street}, {branchInfo.address.city}</span>
              )}
              {branchInfo.phone && <span>Телефон: {branchInfo.phone}</span>}
            </div>
          )}
        </div>
        <button 
          onClick={() => navigate(user.role === 'branch_manager' ? '/branch-manager' : '/branches')} 
          className="btn-secondary"
        >
          ← Назад
        </button>
      </div>

      {reportData && (
        <ReportGenerator 
          data={reportData} 
          type="branch"
          branchName={branchInfo?.name || 'Ваш филиал'}
        />
      )}
    </div>
  );
};

export default BranchReportPage;