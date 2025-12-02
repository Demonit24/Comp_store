import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminApi';

const AdminUserList = ({ onEdit, refresh }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [refresh]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userLogin) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${userLogin}?`)) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Delete user error:', error);
        setError('Не удалось удалить пользователя');
      }
    }
  };

  const getRoleDisplayName = (role) => {
    const roles = {
      'admin': 'Администратор',
      'chief_accountant': 'Главный бухгалтер',
      'branch_manager': 'Менеджер филиала'
    };
    return roles[role] || role;
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="user-list">
      <div className="section-header">
        <h2>Управление пользователями</h2>
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Филиал</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.login}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td>{user.branch?.name || '-'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onEdit(user)}
                      className="btn-secondary"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id, user.login)}
                      className="btn-danger"
                      disabled={user.role === 'admin'} // Нельзя удалять администраторов
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <p>Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;