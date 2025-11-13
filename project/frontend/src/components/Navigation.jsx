import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1>ProfitCalc</h1>
        <p>Система расчета рентабельности</p>
      </div>

      <div className="user-info">
        <div className="user-avatar">
          {user.login.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <strong>{user.login}</strong>
          <span className="user-role">{user.role}</span>
        </div>
      </div>

      <ul className="nav-menu">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            📊 Дашборд
          </NavLink>
        </li>
        <li>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
            💻 Товары
          </NavLink>
        </li>
        <li>
          <NavLink to="/sales" className={({ isActive }) => isActive ? 'active' : ''}>
            🛒 Продажи
          </NavLink>
        </li>
        <li>
          <NavLink to="/branches" className={({ isActive }) => isActive ? 'active' : ''}>
            🏢 Филиалы
          </NavLink>
        </li>
        <li>
          <NavLink to="/suppliers" className={({ isActive }) => isActive ? 'active' : ''}>
            🚚 Поставщики
          </NavLink>
        </li>
      </ul>

      <div className="nav-footer">
        <button onClick={handleLogout} className="logout-btn">
          🚪 Выйти
        </button>
      </div>
    </nav>
  );
};

export default Navigation;