import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

const ProductFilters = ({ filters, onFiltersChange, onSortChange }) => {
  const [categories, setCategories] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    category: '',
    name: '',
    minPrice: '',
    maxPrice: '',
    inStock: '',
    supplierId: ''
  });
  const [sort, setSort] = useState({
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
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
      category: '',
      name: '',
      minPrice: '',
      maxPrice: '',
      inStock: '',
      supplierId: ''
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <h3>Фильтры и сортировка</h3>
        <button onClick={clearFilters} className="btn-secondary">
          Очистить фильтры
        </button>
      </div>

      <div className="filters-grid">
        {/* Поиск по названию */}
        <div className="filter-group">
          <label>Название товара:</label>
          <input
            type="text"
            value={localFilters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            placeholder="Введите название..."
          />
        </div>

        {/* Фильтр по категории */}
        <div className="filter-group">
          <label>Категория:</label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по цене */}
        <div className="filter-group">
          <label>Цена от:</label>
          <input
            type="number"
            value={localFilters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            placeholder="Мин. цена"
            min="0"
          />
        </div>

        <div className="filter-group">
          <label>Цена до:</label>
          <input
            type="number"
            value={localFilters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            placeholder="Макс. цена"
            min="0"
          />
        </div>

        {/* Наличие */}
        <div className="filter-group">
          <label>Наличие:</label>
          <select
            value={localFilters.inStock}
            onChange={(e) => handleFilterChange('inStock', e.target.value)}
          >
            <option value="">Все</option>
            <option value="true">В наличии</option>
            <option value="false">Нет в наличии</option>
          </select>
        </div>

        {/* Сортировка */}
        <div className="filter-group">
          <label>Сортировать по:</label>
          <select
            value={sort.sortBy}
            onChange={(e) => handleSortChange('sortBy', e.target.value)}
          >
            {/*<option value="created_at">Дате добавления</option>*/}
            <option value="name">Названию</option>
            <option value="sellingPrice">Цене</option>
            {/*<option value="profitMargin">Марже</option>*/}
            {/*<option value="profitability">Рентабельности</option>*/}
            <option value="quantity">Количеству</option>
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

export default ProductFilters;