import * as sheetjs from 'sheetjs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Chart from 'chart.js/auto';

// Экспорт в Excel
export const exportToExcel = (data, fileName, sheetName = 'Данные') => {
  try {
    // Создаем рабочую книгу
    const workbook = sheetjs.utils.book_new();
    
    // Преобразуем данные в рабочий лист
    const worksheet = sheetjs.utils.json_to_sheet(data);
    
    // Добавляем рабочий лист в книгу
    sheetjs.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Генерируем Excel файл
    const excelBuffer = sheetjs.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Сохраняем файл
    saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Ошибка при экспорте в Excel:', error);
    return false;
  }
};

// Экспорт в PDF
export const exportToPDF = async (title, content, charts = [], fileName) => {
  try {
    // Создаем PDF документ
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Заголовок
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Дата генерации
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Сгенерировано: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Добавляем содержимое
    if (content.tables && Array.isArray(content.tables)) {
      content.tables.forEach((table, index) => {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        // Заголовок таблицы
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text(table.title, 14, yPosition);
        yPosition += 10;

        // Таблица
        doc.autoTable({
          startY: yPosition,
          head: table.headers,
          body: table.data,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202], textColor: 255 },
          margin: { top: 10 },
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      });
    }

    // Добавляем текстовые блоки
    if (content.textBlocks && Array.isArray(content.textBlocks)) {
      content.textBlocks.forEach((block, index) => {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(block.text, pageWidth - 30);
        doc.text(block.title, 14, yPosition);
        yPosition += 7;
        doc.setFontSize(10);
        doc.text(lines, 14, yPosition);
        yPosition += lines.length * 5 + 15;
      });
    }

    // Добавляем графики
    if (charts.length > 0) {
      for (let i = 0; i < charts.length; i++) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        const canvas = charts[i];
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, yPosition, pageWidth - 40, 80);
        yPosition += 100;
      }
    }

    // Сохраняем PDF
    doc.save(`${fileName || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Ошибка при экспорте в PDF:', error);
    return false;
  }
};

// Создание данных для графика рентабельности
export const createProfitabilityChart = (products, chartId = 'profitabilityChart') => {
  const ctx = document.getElementById(chartId);
  if (!ctx) return null;

  // Сортируем товары по рентабельности
  const sortedProducts = [...products]
    .sort((a, b) => b.profitability - a.profitability)
    .slice(0, 10);

  const labels = sortedProducts.map(p => p.name.substring(0, 20) + (p.name.length > 20 ? '...' : ''));
  const profitabilityData = sortedProducts.map(p => p.profitability);

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Рентабельность (%)',
        data: profitabilityData,
        backgroundColor: profitabilityData.map(value => 
          value > 50 ? 'rgba(75, 192, 192, 0.7)' : 
          value > 20 ? 'rgba(54, 162, 235, 0.7)' : 
          value > 0 ? 'rgba(255, 206, 86, 0.7)' : 
          'rgba(255, 99, 132, 0.7)'
        ),
        borderColor: profitabilityData.map(value => 
          value > 50 ? 'rgba(75, 192, 192, 1)' : 
          value > 20 ? 'rgba(54, 162, 235, 1)' : 
          value > 0 ? 'rgba(255, 206, 86, 1)' : 
          'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Топ 10 товаров по рентабельности'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Рентабельность (%)'
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
};

// Создание данных для графика продаж
export const createSalesChart = (sales, chartId = 'salesChart') => {
  const ctx = document.getElementById(chartId);
  if (!ctx) return null;

  // Группируем продажи по дням
  const salesByDay = {};
  sales.forEach(sale => {
    if (sale.saleDate) {
      const date = new Date(sale.saleDate).toLocaleDateString();
      salesByDay[date] = (salesByDay[date] || 0) + parseFloat(sale.totalAmount);
    }
  });

  const labels = Object.keys(salesByDay).slice(-30); // Последние 30 дней
  const data = labels.map(date => salesByDay[date]);

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Выручка ($)',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Динамика выручки за последние 30 дней'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Выручка ($)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Дата'
          }
        }
      }
    }
  });
};

// Подготовка данных для отчета главного бухгалтера
export const prepareAccountantReportData = (stats, products, sales) => {
  // Данные для Excel
  const excelData = [
    { 'Показатель': 'Всего товаров', 'Значение': stats.totalProducts },
    { 'Показатель': 'Всего продаж', 'Значение': stats.totalSales },
    { 'Показатель': 'Общая выручка', 'Значение': `$${stats.totalRevenue.toFixed(2)}` },
    { 'Показатель': 'Средняя рентабельность', 'Значение': `${stats.averageProfitability}%` },
    { 'Показатель': 'Общая прибыль', 'Значение': `$${stats.totalProfit || 0}` },
  ];

  // Данные для PDF
  const pdfContent = {
    tables: [
      {
        title: 'Общая статистика предприятия',
        headers: [['Показатель', 'Значение']],
        data: [
          ['Всего товаров', stats.totalProducts.toString()],
          ['Всего продаж', stats.totalSales.toString()],
          ['Общая выручка', `$${stats.totalRevenue.toFixed(2)}`],
          ['Средняя рентабельность', `${stats.averageProfitability}%`],
          ['Общая прибыль', `$${stats.totalProfit || 0}`],
        ]
      },
      {
        title: 'Топ 10 товаров по рентабельности',
        headers: [['Товар', 'Категория', 'Себестоимость', 'Цена', 'Рентабельность', 'Маржа']],
        data: products.slice(0, 10).map(product => [
          product.name.substring(0, 30),
          product.category,
          `$${product.costPrice}`,
          `$${product.sellingPrice}`,
          `${product.profitability || product.calculatedProfitability || 0}%`,
          `$${product.profitMargin || product.calculatedProfitMargin || 0}`
        ])
      }
    ],
    textBlocks: [
      {
        title: 'Анализ рентабельности',
        text: `На основе анализа ${stats.totalProducts} товаров и ${stats.totalSales} продаж, средняя рентабельность предприятия составляет ${stats.averageProfitability}%. Общая выручка: $${stats.totalRevenue.toFixed(2)}, прибыль: $${stats.totalProfit || 0}.`
      }
    ]
  };

  return { excelData, pdfContent };
};

// Подготовка данных для отчета менеджера филиала
export const prepareManagerReportData = (stats, branchName, sales, products) => {
  // Данные для Excel
  const excelData = [
    { 'Показатель': 'Филиал', 'Значение': branchName },
    { 'Показатель': 'Продажи сегодня', 'Значение': stats.todaySales },
    { 'Показатель': 'Общая выручка', 'Значение': `$${stats.totalRevenue.toFixed(2)}` },
    { 'Показатель': 'Товары в наличии', 'Значение': stats.productsInStock },
  ];

  // Данные для PDF
  const pdfContent = {
    tables: [
      {
        title: `Статистика филиала: ${branchName}`,
        headers: [['Показатель', 'Значение']],
        data: [
          ['Продажи сегодня', stats.todaySales.toString()],
          ['Общая выручка', `$${stats.totalRevenue.toFixed(2)}`],
          ['Товары в наличии', stats.productsInStock.toString()],
          ['Филиал', branchName],
        ]
      },
      {
        title: 'Последние 10 продаж филиала',
        headers: [['Товар', 'Количество', 'Цена за ед.', 'Общая сумма', 'Дата']],
        data: sales.slice(0, 10).map(sale => [
          sale.product?.name?.substring(0, 25) || 'Неизвестно',
          sale.quantity.toString(),
          `$${sale.unitPrice}`,
          `$${sale.totalAmount}`,
          new Date(sale.saleDate).toLocaleDateString()
        ])
      }
    ],
    textBlocks: [
      {
        title: 'Анализ эффективности филиала',
        text: `Филиал "${branchName}" показал ${stats.todaySales} продаж за сегодня. Общая выручка филиала составляет $${stats.totalRevenue.toFixed(2)}. В наличии ${stats.productsInStock} товаров.`
      }
    ]
  };

  return { excelData, pdfContent };
};