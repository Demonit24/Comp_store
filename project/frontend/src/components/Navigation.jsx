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

  const getRoleDisplayName = (role) => {
    const roles = {
      'admin': 'Администратор',
      'chief_accountant': 'Главный бухгалтер',
      'branch_manager': 'Менеджер филиала'
    };
    return roles[role] || role;
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
          <span className="user-role">{getRoleDisplayName(user.role)}</span>
          {user.branch && <span className="user-branch">{user.branch.name}</span>}
        </div>
      </div>

      <ul className="nav-menu">
        {/* Меню для администратора */}
        {user.role === 'admin' && (
          <>
          <li>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              👑 Админ-панель
            </NavLink>
          </li>
          {/* <li>
           <NavLink to="/enterprise-report" className={({ isActive }) => isActive ? 'active' : ''}>
             📊 Отчет предприятия
           </NavLink>
         </li>
         <li>
           <NavLink to="/branch-report" className={({ isActive }) => isActive ? 'active' : ''}>
             🏢 Отчет филиала
           </NavLink>
         </li>*/}
         </>
        )}

        {/* Меню для главного бухгалтера и администратора */}
        {(user.role === 'admin' || user.role === 'chief_accountant') && (
          <>
            <li>
              <NavLink to="/chief-accountant" className={({ isActive }) => isActive ? 'active' : ''}>
                📊 Дашборд бухгалтера
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
                💻 Товары
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
            <li>
              <NavLink to="/enterprise-report" className={({ isActive }) => isActive ? 'active' : ''}>
                📊 Отчет предприятия
              </NavLink>
            </li>
          </>
        )}

        {/* Меню для менеджера филиала */}
        {user.role === 'branch_manager' && (
  <>
    <li>
      <NavLink to="/branch-manager" className={({ isActive }) => isActive ? 'active' : ''}>
        🏪 Панель менеджера
      </NavLink>
    </li>
    <li>
      <NavLink to="/branch-sales" className={({ isActive }) => isActive ? 'active' : ''}>
        🛒 Продажи филиала
      </NavLink>
    </li>
    <li>
      <NavLink to="/branch-view" className={({ isActive }) => isActive ? 'active' : ''}>
        🏢 Мой филиал
      </NavLink>
    </li>
    <li>
      <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
        📦 Товары
      </NavLink>
    </li>
    {/*<li>
      <NavLink to="/branch-report" className={({ isActive }) => isActive ? 'active' : ''}>
        📊 Отчет филиала
      </NavLink>
    </li>*/}
  </>
)}

        {/* Общее меню для всех ролей */}
        <li>
          <NavLink to="/sales" className={({ isActive }) => isActive ? 'active' : ''}>
            🛒 Продажи
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