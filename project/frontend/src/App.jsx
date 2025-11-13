import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Branches from './pages/Branches';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';

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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="branches" element={<Branches />} />
            <Route path="sales" element={<Sales />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        )}
      </Routes>
    </div>
  );
}

export default App;