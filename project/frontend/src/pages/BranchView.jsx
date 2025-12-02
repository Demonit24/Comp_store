import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { branchesAPI } from '../services/api';

const BranchView = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      
      // Менеджер видит только свой филиал
      let response;
      if (user.role === 'branch_manager' && user.branchId) {
        response = await branchesAPI.getById(user.branchId);
        setBranches([response.data]);
      } else {
        response = await branchesAPI.getAll();
        setBranches(response.data);
      }
    } catch (error) {
      setError('Не удалось загрузить филиалы');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="branches-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Просмотр филиалов</h1>
          <p>{user.role === 'branch_manager' ? 'Информация о вашем филиале' : 'Список всех филиалов'}</p>
        </div>
        {user.role !== 'branch_manager' && (
          <button className="btn-primary" disabled>
            Только просмотр
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Менеджер</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(branch => (
              <tr key={branch.id}>
                <td>
                  {branch.name}
                  {branch.id === user.branchId && <span className="badge">Ваш филиал</span>}
                </td>
                <td>
                  {branch.address && (
                    `${branch.address.street}, ${branch.address.city}`
                  )}
                </td>
                <td>{branch.phone || '-'}</td>
                <td>{branch.email || '-'}</td>
                <td>{branch.manager?.login || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {branches.length === 0 && !loading && (
        <div className="empty-state">
          <p>Филиалы не найдены</p>
        </div>
      )}
    </div>
  );
};

export default BranchView;