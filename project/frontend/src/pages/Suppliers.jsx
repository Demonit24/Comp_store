import React, { useState, useEffect } from 'react';
import { suppliersAPI } from '../services/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: { firstName: '', lastName: '' },
    phone: '',
    email: '',
    address: { street: '', city: '', country: '' }
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      setError('Не удалось загрузить поставщиков');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setFormData({
      companyName: '',
      contactPerson: { firstName: '', lastName: '' },
      phone: '',
      email: '',
      address: { street: '', city: '', country: '' }
    });
    setShowForm(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson || { firstName: '', lastName: '' },
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || { street: '', city: '', country: '' }
    });
    setShowForm(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      try {
        await suppliersAPI.delete(id);
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
      } catch (error) {
        setError('Не удалось удалить поставщика');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (error) {
      setError(error.response?.data?.message || 'Не удалось сохранить поставщика');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactPerson.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [contactField]: value
        }
      }));
    } else if (name.startsWith('address.')) {
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
    <div className="suppliers-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Управление поставщиками</h1>
          <p>Добавление и редактирование поставщиков компьютерной техники</p>
        </div>
        <button onClick={handleAddSupplier} className="btn-primary">
          + Добавить поставщика
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Компания</th>
              <th>Контактное лицо</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Адрес</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>{supplier.companyName}</td>
                <td>
                  {supplier.contactPerson && (
                    `${supplier.contactPerson.firstName} ${supplier.contactPerson.lastName}`
                  )}
                </td>
                <td>{supplier.phone || '-'}</td>
                <td>{supplier.email || '-'}</td>
                <td>
                  {supplier.address && (
                    `${supplier.address.street}, ${supplier.address.city}`
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEditSupplier(supplier)}
                      className="btn-secondary"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(supplier.id)}
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

      {suppliers.length === 0 && !loading && (
        <div className="empty-state">
          <p>Поставщики не найдены</p>
        </div>
      )}

      {showForm && (
        <div className="form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingSupplier ? 'Редактировать поставщика' : 'Добавить поставщика'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название компании:</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Введите название компании"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Имя контактного лица:</label>
                  <input
                    type="text"
                    name="contactPerson.firstName"
                    value={formData.contactPerson.firstName}
                    onChange={handleChange}
                    placeholder="Имя"
                  />
                </div>
                <div className="form-group">
                  <label>Фамилия контактного лица:</label>
                  <input
                    type="text"
                    name="contactPerson.lastName"
                    value={formData.contactPerson.lastName}
                    onChange={handleChange}
                    placeholder="Фамилия"
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
              </div>

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

              <div className="form-row">
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
              </div>

              <div className="form-actions">
                <button type="submit">
                  {editingSupplier ? 'Обновить' : 'Создать'}
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

export default Suppliers;