import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

// Убедитесь, что useAuth правильно экспортируется
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser()
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (loginData) => {
    try {
      const response = await authAPI.login(loginData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData) => {
    try {
      const response = await authAPI.register(registerData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Дополнительный экспорт по умолчанию для совместимости
export default AuthContext;