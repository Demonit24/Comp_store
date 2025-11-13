import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

const ProductList = ({ onEdit, refresh }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, [refresh]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productsAPI.getAll({ 
        page: 1, 
        limit: 100
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
      const errorMessage = error.response?.data?.message || 
                          'Не удалось загрузить товары';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => { // Изменили параметр на productId
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        console.log('Deleting product with ID:', productId); // Добавим лог
        await productsAPI.delete(productId);
        setProducts(products.filter(product => product.id !== productId));
      } catch (error) {
        console.error('Delete error:', error);
        setError('Не удалось удалить товар');
      }
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="product-list">
      <div className="section-header">
        <h2>Список товаров</h2>
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Себестоимость</th>
              <th>Цена продажи</th>
              <th>Маржа</th>
              <th>Рентабельность</th>
              <th>Количество</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <span className={`category-badge category-${product.category}`}>
                    {product.category}
                  </span>
                </td>
                <td>${product.costPrice}</td>
                <td>${product.sellingPrice}</td>
                <td className={product.profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}>
                  ${product.profitMargin}
                </td>
                <td className={product.profitability >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {product.profitability}%
                </td>
                <td>
                  <span className={`quantity ${product.quantity === 0 ? 'out-of-stock' : product.quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                    {product.quantity}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onEdit(product)}
                      className="btn-secondary"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)} // Убедитесь, что передается product.id
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

      {products.length === 0 && !loading && (
        <div className="empty-state">
          <p>Товары не найдены</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;