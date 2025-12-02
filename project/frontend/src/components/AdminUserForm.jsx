import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminApi';
import { branchesAPI } from '../services/api';

const AdminUserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    role: 'branch_manager',
    branchId: ''
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBranches();
    
    if (user) {
      setFormData({
        login: user.login || '',
        email: user.email || '',
        password: '', // Пароль не показываем при редактировании
        role: user.role || 'branch_manager',
        branchId: user.branchId || ''
      });
    }
  }, [user]);

  const loadBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error('Не удалось загрузить филиалы');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const userData = {
        login: formData.login.trim(),
        email: formData.email.trim(),
        role: formData.role,
        branchId: formData.role === 'branch_manager' ? formData.branchId : null
      };

      // Добавляем пароль только если он указан (при создании или изменении)
      if (formData.password) {
        userData.password = formData.password;
      }

      console.log('Sending user data:', userData);
      
      if (user) {
        await adminAPI.updateUser(user.id, userData);
      } else {
        await adminAPI.createUser(userData);
      }
      
      onSave();
    } catch (error) {
      console.error('User save error:', error);
      const errorMessage = error.response?.data?.message || 
                          'Не удалось сохранить пользователя';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? 'Редактировать пользователя' : 'Создать пользователя'}</h2>
          {error && <div className="error-message">{error}</div>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин:</label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              minLength="3"
              placeholder="Введите логин"
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Введите email"
            />
          </div>
          
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user} // Обязателен только при создании
              minLength="6"
              placeholder={user ? "Оставьте пустым, чтобы не менять" : "Введите пароль"}
            />
          </div>
          
          <div className="form-group">
            <label>Роль:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="branch_manager">Менеджер филиала</option>
              <option value="chief_accountant">Главный бухгалтер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          {formData.role === 'branch_manager' && (
            <div className="form-group">
              <label>Филиал:</label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                required={formData.role === 'branch_manager'}
              >
                <option value="">Выберите филиал</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : (user ? 'Обновить' : 'Создать')}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserForm;