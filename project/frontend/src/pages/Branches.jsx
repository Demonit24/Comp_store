import React, { useState, useEffect } from 'react';
import { branchesAPI } from '../services/api';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: { street: '', city: '', country: '', postalCode: '' },
    phone: '',
    email: '',
    managerId: ''
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesAPI.getAll();
      setBranches(response.data);
    } catch (error) {
      setError('Не удалось загрузить филиалы');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: { street: '', city: '', country: '', postalCode: '' },
      phone: '',
      email: '',
      managerId: ''
    });
    setShowForm(true);
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || { street: '', city: '', country: '', postalCode: '' },
      phone: branch.phone || '',
      email: branch.email || '',
      managerId: branch.managerId || ''
    });
    setShowForm(true);
  };

  const handleDeleteBranch = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот филиал?')) {
      try {
        await branchesAPI.delete(id);
        setBranches(branches.filter(branch => branch.id !== id));
      } catch (error) {
        setError('Не удалось удалить филиал');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      if (editingBranch) {
        await branchesAPI.update(editingBranch.id, formData);
      } else {
        await branchesAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingBranch(null);
      loadBranches();
    } catch (error) {
      setError(error.response?.data?.message || 'Не удалось сохранить филиал');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="branches-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Управление филиалами</h1>
          <p>Добавление и редактирование филиалов компании</p>
        </div>
        <button onClick={handleAddBranch} className="btn-primary">
          + Добавить филиал
        </button>
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
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(branch => (
              <tr key={branch.id}>
                <td>{branch.name}</td>
                <td>
                  {branch.address && (
                    `${branch.address.street}, ${branch.address.city}`
                  )}
                </td>
                <td>{branch.phone || '-'}</td>
                <td>{branch.email || '-'}</td>
                <td>{branch.manager?.login || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEditBranch(branch)}
                      className="btn-secondary"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="btn-danger"
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

      {branches.length === 0 && !loading && (
        <div className="empty-state">
          <p>Филиалы не найдены</p>
        </div>
      )}

      {showForm && (
        <div className="form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingBranch ? 'Редактировать филиал' : 'Добавить филиал'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название филиала:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Введите название филиала"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Улица:</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Улица"
                  />
                </div>
                <div className="form-group">
                  <label>Город:</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Город"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Страна:</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="Страна"
                  />
                </div>
                <div className="form-group">
                  <label>Почтовый индекс:</label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    placeholder="Почтовый индекс"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Телефон:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Номер телефона"
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email адрес"
                  />
                </div>
                <div className="form-group">
                  <label>ID менеджера:</label>
                  <input
                    type="integer"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleChange}
                    placeholder="ID"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">
                  {editingBranch ? 'Обновить' : 'Создать'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;