import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportGenerator = ({ data, type = 'enterprise', branchName = '' }) => {
  const reportRef = useRef();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const exportToPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${type}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Данные для графиков
  const salesByDayData = data?.salesByDay || [];
  const branchStatsData = data?.branchStats || [];
  const categoryStatsData = data?.categoryStats || [];

  return (
    <div>
      <button onClick={exportToPDF} className="btn-primary">
        📊 Экспорт отчета в PDF
      </button>

      <div ref={reportRef} style={{ 
        padding: '20px', 
        background: 'white',
        minHeight: '100vh'
      }}>
        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>{type === 'enterprise' ? 'ОТЧЕТ ПО РЕНТАБЕЛЬНОСТИ ПРЕДПРИЯТИЯ' : `ОТЧЕТ ПО ФИЛИАЛУ: ${branchName}`}</h1>
          <p>Дата генерации: {new Date().toLocaleDateString('ru-RU')}</p>
          <p>Период анализа: последние 30 дней</p>
        </div>

        {/* Основная статистика */}
        <div style={{ marginBottom: '30px' }}>
          <h2>ОСНОВНЫЕ ПОКАЗАТЕЛИ</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
              <h3>Общая выручка</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                ${data?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
              <h3>Общая прибыль</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                ${data?.totalProfit?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
              <h3>Рентабельность</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                {data?.profitability?.toFixed(2) || '0.00'}%
              </p>
            </div>
            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
              <h3>Всего продаж</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                {data?.totalSales || 0}
              </p>
            </div>
          </div>
        </div>

        {/* График продаж по дням */}
        {salesByDayData.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2>ДИНАМИКА ПРОДАЖ ПО ДНЯМ</h2>
            <div style={{ height: '400px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesByDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Выручка ($)" />
                  <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Прибыль ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* График по филиалам (только для enterprise) */}
        {type === 'enterprise' && branchStatsData.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2>ВЫРУЧКА ПО ФИЛИАЛАМ</h2>
            <div style={{ height: '400px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchStatsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Выручка ($)" />
                  <Bar dataKey="profit" fill="#82ca9d" name="Прибыль ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Круговой график по категориям */}
        {categoryStatsData.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2>РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ</h2>
            <div style={{ height: '400px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStatsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Топ товаров таблица */}
        {data?.topProducts && data.topProducts.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2>ТОП ТОВАРОВ ПО РЕНТАБЕЛЬНОСТИ</h2>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              marginTop: '20px'
            }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Товар</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Категория</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Себестоимость</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Цена</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Рентабельность</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{product.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{product.category}</td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>${product.costPrice?.toFixed(2)}</td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>${product.sellingPrice?.toFixed(2)}</td>
                    <td style={{ 
                      padding: '10px', 
                      border: '1px solid #e2e8f0',
                      color: (product.profitability || 0) >= 0 ? '#38a169' : '#e53e3e',
                      fontWeight: 'bold'
                    }}>
                      {product.profitability?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Рекомендации */}
        <div style={{ marginTop: '50px', padding: '20px', background: '#f0fff4', borderRadius: '8px' }}>
          <h2>РЕКОМЕНДАЦИИ</h2>
          <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
            <li style={{ marginBottom: '10px' }}>Увеличить поставки наиболее рентабельных товаров</li>
            <li style={{ marginBottom: '10px' }}>Провести анализ работы менее рентабельных филиалов/дней</li>
            <li style={{ marginBottom: '10px' }}>Рассмотреть возможность оптимизации себестоимости</li>
            <li style={{ marginBottom: '10px' }}>Увеличить продажи через наиболее эффективные каналы</li>
            <li style={{ marginBottom: '10px' }}>Провести обучение персонала по продажам высокомаржинальных товаров</li>
          </ul>
        </div>

        {/* Футер */}
        <div style={{ 
          marginTop: '50px', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: '#718096'
        }}>
          <p>Отчет сгенерирован автоматически системой управления рентабельностью</p>
          <p>© {new Date().getFullYear()} Profitability Calculator System</p>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;