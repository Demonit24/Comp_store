import React, { useState, useEffect } from 'react';
import { salesAPI, productsAPI, branchesAPI } from '../services/api';
import SalesFilters from '../components/SalesFilters';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({});
  const [formData, setFormData] = useState({
    productId: '',
    branchId: '',
    quantity: 1,
    unitPrice: ''
  });

  useEffect(() => {
    loadSales();
    loadProducts();
    loadBranches();
  }, []);

  // Добавляем эффект для перезагрузки продаж при изменении фильтров или сортировки
  useEffect(() => {
    loadSales();
  }, [filters, sort]);

  const loadSales = async () => {
    try {
      setLoading(true);
      
      // Объединяем фильтры и сортировку в параметры запроса
      const params = {
        ...filters,
        ...sort,
        page: 1,
        limit: 100
      };

      console.log('Loading sales with params:', params); // Для отладки

      const response = await salesAPI.getAll(params);
      setSales(response.data.sales || response.data); // Учитываем оба формата ответа
    } catch (error) {
      console.error('Error loading sales:', error);
      setError('Не удалось загрузить продажи');
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

  const loadBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data);
    } catch (error) {
      console.error('Не удалось загрузить филиалы');
    }
  };

  const handleFiltersChange = (newFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const handleSortChange = (newSort) => {
    console.log('Sort changed:', newSort);
    setSort(newSort);
  };

  const handleAddSale = () => {
    setEditingSale(null);
    setFormData({
      productId: '',
      branchId: '',
      quantity: 1,
      unitPrice: ''
    });
    setShowForm(true);
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setFormData({
      productId: sale.productId.toString(),
      branchId: sale.branchId.toString(),
      quantity: sale.quantity,
      unitPrice: sale.unitPrice.toString()
    });
    setShowForm(true);
  };

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту продажу?')) {
      try {
        await salesAPI.delete(saleId);
        loadSales(); // Перезагружаем данные
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
      const saleData = {
        productId: parseInt(formData.productId),
        branchId: parseInt(formData.branchId),
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice)
      };

      console.log('Sending sale data:', saleData);

      if (editingSale) {
        await salesAPI.update(editingSale.id, saleData);
      } else {
        await salesAPI.create(saleData);
      }

      setShowForm(false);
      setEditingSale(null);
      loadSales(); // Перезагружаем данные после сохранения
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
          <h1>Управление продажами</h1>
          <p>Оформление, редактирование и удаление продаж компьютерной техники</p>
        </div>
        <button onClick={handleAddSale} className="btn-primary">
          + Новая продажа
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Панель фильтров */}
      <SalesFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Товар</th>
              <th>Филиал</th>
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
                <td>{sale.branch?.name}</td>
                <td>{sale.quantity}</td>
                <td>${sale.unitPrice}</td>
                <td>${sale.totalAmount}</td>
                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                <td>{sale.user?.login}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEditSale(sale)}
                      className="btn-secondary"
                    >
                      Редактировать
                    </button>
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
              <h2>{editingSale ? 'Редактировать продажу' : 'Оформление продажи'}</h2>
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
              <div className="form-group">
                <label>Филиал:</label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите филиал</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
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
                  {editingSale ? 'Обновить продажу' : 'Оформить продажу'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSale(null);
                  }}
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

export default Sales;