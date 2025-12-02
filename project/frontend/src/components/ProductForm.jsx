import React, { useState, useEffect } from 'react';
import { productsAPI, suppliersAPI } from '../services/api';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'laptop',
    costPrice: '',
    sellingPrice: '',
    description: '',
    quantity: '',
    supplierId: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Добавьте это состояние

  useEffect(() => {
    loadSuppliers();
    
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || 'laptop',
        costPrice: product.costPrice || '',
        sellingPrice: product.sellingPrice || '',
        description: product.description || '',
        quantity: product.quantity || '',
        supplierId: product.supplierId || ''
      });
    }
  }, [product]);

  const loadSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Не удалось загрузить поставщиков');
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
      setError(''); // Сбрасываем ошибку перед отправкой
      
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity) || 0,
        description: formData.description.trim(),
        supplierId: formData.supplierId || null
      };

      console.log('Sending product data:', productData);
      
      if (product) {
        await productsAPI.update(product.id, productData);
      } else {
        await productsAPI.create(productData);
      }
      
      onSave();
    } catch (error) {
      console.error('Product save error:', error);
      // Используем setError который теперь объявлен
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.details?.[0]?.message || 
                          'Не удалось сохранить товар';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData.costPrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    const margin = selling - cost;
    const profitability = cost > 0 ? ((margin / cost) * 100).toFixed(2) : 0;
    
    return { margin, profitability };
  };

  const { margin, profitability } = calculateProfit();

  return (
    <div className="form-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
          {error && <div className="error-message">{error}</div>} {/* Отображаем ошибку */}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название товара:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Введите название товара"
            />
          </div>
          
          <div className="form-group">
            <label>Категория:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="laptop">Ноутбук</option>
              <option value="desktop">Компьютер</option>
              <option value="monitor">Монитор</option>
              <option value="accessory">Аксессуар</option>
              <option value="component">Комплектующее</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Себестоимость ($):</label>
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Цена продажи ($):</label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
          </div>

          {formData.costPrice && formData.sellingPrice && (
            <div className="profit-preview">
              <div className="profit-item">
                <span>Маржа:</span>
                <span className={margin >= 0 ? 'profit-positive' : 'profit-negative'}>
                  ${margin.toFixed(2)}
                </span>
              </div>
              <div className="profit-item">
                <span>Рентабельность:</span>
                <span className={profitability >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {profitability}%
                </span>
              </div>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label>Количество на складе:</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                required
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>Поставщик:</label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
              >
                <option value="">Выберите поставщика</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Введите описание товара"
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : (product ? 'Обновить' : 'Создать')}
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

export default ProductForm;