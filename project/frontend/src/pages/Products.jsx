import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import ProductFilters from '../components/ProductFilters';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({});

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setRefreshTrigger(prev => prev + 1);
  };
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = () => {
    setShowForm(false);
    setEditingProduct(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Управление товарами</h1>
          <p>Добавление, редактирование и анализ рентабельности товаров</p>
        </div>
        <button onClick={handleAddProduct} className="btn-primary">
          + Добавить товар
        </button>
      </div>

      {/* Панель фильтров */}
      <ProductFilters 
  filters={filters}
  onFiltersChange={handleFiltersChange}
  sort={sort}
  onSortChange={handleSortChange}
/>

      {/* Список товаров с передачей фильтров и сортировки */}
      <ProductList
        onEdit={handleEditProduct}
        refresh={refreshTrigger}
        filters={filters}
        sort={sort}
      />

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default Products;