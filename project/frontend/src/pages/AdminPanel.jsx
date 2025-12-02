import React, { useState } from 'react';
import AdminUserList from '../components/AdminUserList';
import AdminUserForm from '../components/AdminUserForm';

const AdminPanel = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSaveUser = () => {
    setShowForm(false);
    setEditingUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  return (
    <div className="admin-panel">
      <div className="page-header">
        <div className="header-content">
          <h1>Панель администратора</h1>
          <p>Управление пользователями и ролями системы</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="btn-primary"
        >
          + Создать пользователя
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Пользователи системы</h3>
          <p>Управление доступом и ролями</p>
        </div>
      </div>

      <AdminUserList 
        onEdit={handleEditUser}
        refresh={refreshTrigger}
      />

      {showForm && (
        <AdminUserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AdminPanel;