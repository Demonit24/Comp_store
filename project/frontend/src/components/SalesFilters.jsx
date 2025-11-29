import React, { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';

const SalesFilters = ({ filters, onFiltersChange, onSortChange }) => {
  const [filterData, setFilterData] = useState({
    products: [],
    branches: [],
    users: []
  });
  const [localFilters, setLocalFilters] = useState({
    productId: '',
    branchId: '',
    userId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [sort, setSort] = useState({
    sortBy: 'sale_date',
    sortOrder: 'DESC'
  });

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const response = await salesAPI.getFiltersData();
      setFilterData(response.data);
    } catch (error) {
      console.error('Error loading sales filter data:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (key, value) => {
    const newSort = {
      ...sort,
      [key]: value
    };
    setSort(newSort);
    onSortChange(newSort);
  };

  const clearFilters = () => {
    const clearedFilters = {
      productId: '',
      branchId: '',
      userId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <h3>Фильтры продаж</h3>
        <button onClick={clearFilters} className="btn-secondary">
          Очистить фильтры
        </button>
      </div>

      <div className="filters-grid">
        {/* Фильтр по товару */}
        <div className="filter-group">
          <label>Товар:</label>
          <select
            value={localFilters.productId}
            onChange={(e) => handleFilterChange('productId', e.target.value)}
          >
            <option value="">Все товары</option>
            {filterData.products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по филиалу */}
        <div className="filter-group">
          <label>Филиал:</label>
          <select
            value={localFilters.branchId}
            onChange={(e) => handleFilterChange('branchId', e.target.value)}
          >
            <option value="">Все филиалы</option>
            {filterData.branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по пользователю */}
        <div className="filter-group">
          <label>Продавец:</label>
          <select
            value={localFilters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          >
            <option value="">Все продавцы</option>
            {filterData.users.map(user => (
              <option key={user.id} value={user.id}>
                {user.login}
              </option>
            ))}
          </select>
        </div>

        {/* Диапазон дат */}
        <div className="filter-group">
          <label>Дата с:</label>
          <input
            type="date"
            value={localFilters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Дата по:</label>
          <input
            type="date"
            value={localFilters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        {/* Диапазон суммы */}
        <div className="filter-group">
          <label>Сумма от:</label>
          <input
            type="number"
            value={localFilters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            placeholder="Мин. сумма"
            min="0"
          />
        </div>

        <div className="filter-group">
          <label>Сумма до:</label>
          <input
            type="number"
            value={localFilters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            placeholder="Макс. сумма"
            min="0"
          />
        </div>

        {/* Сортировка */}
        <div className="filter-group">
          <label>Сортировать по:</label>
          <select
            value={sort.sortBy}
            onChange={(e) => handleSortChange('sortBy', e.target.value)}
          >
            <option value="sale_date">Дате продажи</option>
            <option value="totalAmount">Сумме</option>
            <option value="quantity">Количеству</option>
            <option value="productName">Названию товара</option>
            <option value="branchName">Филиалу</option>
            <option value="userName">Продавцу</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Порядок:</label>
          <select
            value={sort.sortOrder}
            onChange={(e) => handleSortChange('sortOrder', e.target.value)}
          >
            <option value="DESC">По убыванию</option>
            <option value="ASC">По возрастанию</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SalesFilters;