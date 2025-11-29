import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './pages/AdminPanel';
import ChiefAccountantPanel from './pages/ChiefAccountantPanel';
import BranchManagerPanel from './pages/BranchManagerPanel';
import Products from './pages/Products';
import Branches from './pages/Branches';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';

// Компонент для защиты маршрутов по ролям
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route path="/*" element={<Layout />}>
            {/* Администратор */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            
            {/* Главный бухгалтер */}
            <Route path="chief-accountant" element={
              <ProtectedRoute allowedRoles={['admin', 'chief_accountant']}>
                <ChiefAccountantPanel />
              </ProtectedRoute>
            } />
            
            {/* Менеджер филиала */}
            <Route path="branch-manager" element={
              <ProtectedRoute allowedRoles={['admin', 'branch_manager']}>
                <BranchManagerPanel />
              </ProtectedRoute>
            } />
            
            {/* Общие маршруты с проверкой прав */}
            <Route path="products" element={
              <ProtectedRoute allowedRoles={['admin', 'chief_accountant']}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="branches" element={
              <ProtectedRoute allowedRoles={['admin', 'chief_accountant']}>
                <Branches />
              </ProtectedRoute>
            } />
            <Route path="sales" element={
              <ProtectedRoute allowedRoles={['admin', 'chief_accountant', 'branch_manager']}>
                <Sales />
              </ProtectedRoute>
            } />
            <Route path="suppliers" element={
              <ProtectedRoute allowedRoles={['admin', 'chief_accountant']}>
                <Suppliers />
              </ProtectedRoute>
            } />
            
            {/* Перенаправление по умолчанию в зависимости от роли */}
            <Route path="dashboard" element={<Navigate to={
              user.role === 'admin' ? '/admin' :
              user.role === 'chief_accountant' ? '/chief-accountant' :
              user.role === 'branch_manager' ? '/branch-manager' : '/chief-accountant'
            } />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        )}
      </Routes>
    </div>
  );
}

export default App;