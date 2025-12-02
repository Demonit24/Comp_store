import React from 'react';
import Dashboard from './Dashboard';
import { useNavigate } from 'react-router-dom';

const ChiefAccountantPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="chief-accountant-panel">
      <div className="page-header">
        <div className="header-content">
          <h1>Панель главного бухгалтера</h1>
          <p>Управление финансами и аналитика рентабельности предприятия</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/enterprise-report')}
            className="btn-primary"
          >
            📊 Создать отчет предприятия
          </button>
        </div>
      </div>
      <Dashboard />
    </div>
  );
};

export default ChiefAccountantPanel;