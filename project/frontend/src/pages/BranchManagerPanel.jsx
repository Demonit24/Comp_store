import React from 'react';

const BranchManagerPanel = () => {
  return (
    <div className="branch-manager-panel">
      <div className="page-header">
        <div className="header-content">
          <h1>Панель менеджера филиала</h1>
          <p>Управление продажами и товарами вашего филиала</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>Продажи сегодня</h3>
            <div className="stat-value">0</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Выручка</h3>
            <div className="stat-value">$0</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Товары в наличии</h3>
            <div className="stat-value">0</div>
          </div>
        </div>
      </div>

      <div className="placeholder-content">
        <div className="placeholder-card">
          <h3>Функциональность в разработке</h3>
          <p>Здесь будет отображаться информация о продажах и товарах вашего филиала.</p>
          <ul>
            <li>📊 Статистика продаж по филиалу</li>
            <li>📦 Управление остатками товаров</li>
            <li>👥 Управление персоналом филиала</li>
            <li>📈 Отчеты по эффективности</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BranchManagerPanel;