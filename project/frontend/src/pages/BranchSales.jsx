import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesAPI, productsAPI } from '../services/api';

const BranchSales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    unitPrice: ''
  });

  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await salesAPI.getAll({ 
        limit: 100,
        sortBy: 'sale_date',
        sortOrder: 'DESC'
      });
      
      console.log('Sales response:', response);
      
      let salesData = [];
      if (response.data && response.data.sales) {
        salesData = response.data.sales;
      } else if (Array.isArray(response.data)) {
        salesData = response.data;
      }
      
      console.log('Loaded sales:', salesData.length);
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Не удалось загрузить продажи';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 1000 });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Не удалось загрузить товары');
    }
  };

  const handleAddSale = () => {
    setFormData({
      productId: '',
      quantity: 1,
      unitPrice: ''
    });
    setShowForm(true);
  };

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту продажу?')) {
      try {
        await salesAPI.delete(saleId);
        loadSales();
      } catch (error) {
        console.error('Delete sale error:', error);
        setError('Не удалось удалить продажу');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Явно передаем branchId менеджера
      const saleData = {
        productId: parseInt(formData.productId),
        branchId: user.branchId, // Явно передаем branchId менеджера
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice)
      };

      console.log('Manager creating sale with branchId:', saleData);

      await salesAPI.create(saleData);

      setShowForm(false);
      loadSales();
    } catch (error) {
      console.error('Sale error:', error);
      const errorMessage = error.response?.data?.message ||
        'Не удалось оформить продажу';
      setError(errorMessage);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productId: value,
          unitPrice: selectedProduct.sellingPrice
        }));
      }
    }
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return (quantity * unitPrice).toFixed(2);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="sales-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Продажи вашего филиала</h1>
          <p>Управление продажами только для вашего филиала</p>
        </div>
        <button onClick={handleAddSale} className="btn-primary">
          + Новая продажа
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Товар</th>
              <th>Количество</th>
              <th>Цена за единицу</th>
              <th>Общая сумма</th>
              <th>Дата продажи</th>
              <th>Продавец</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.product?.name}</td>
                <td>{sale.quantity}</td>
                <td>${sale.unitPrice}</td>
                <td>${sale.totalAmount}</td>
                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                <td>{sale.user?.login}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
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

      {sales.length === 0 && !loading && (
        <div className="empty-state">
          <p>Продажи не найдены</p>
        </div>
      )}

      {showForm && (
        <div className="form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Оформление продажи</h2>
              <p>Филиал: <strong>Ваш филиал (ID: {user.branchId})</strong></p>
              {error && <div className="error-message">{error}</div>}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Товар:</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите товар</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${product.sellingPrice}, в наличии: {product.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Количество:</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Цена за единицу ($):</label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {formData.quantity && formData.unitPrice && (
                <div className="sale-summary">
                  <div className="summary-item">
                    <span>Общая сумма:</span>
                    <strong>${calculateTotal()}</strong>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit">
                  Оформить продажу
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

export default BranchSales;