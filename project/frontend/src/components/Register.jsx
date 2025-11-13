import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.login || !formData.password || !formData.email) {
      return setError('Все поля обязательны для заполнения');
    }

    if (formData.password.length < 6) {
      return setError('Пароль должен содержать минимум 6 символов');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Пароли не совпадают');
    }

    try {
      setError('');
      setLoading(true);
      
      // Подготовка данных для отправки
      const registerData = {
        login: formData.login.trim(),
        password: formData.password,
        email: formData.email.trim()
      };
      
      console.log('Sending registration data:', registerData);
      
      await register(registerData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Ошибка регистрации. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Регистрация</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Логин:</label>
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            required
            minLength="3"
            placeholder="Придумайте логин (мин. 3 символа)"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Введите ваш email"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Пароль:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            placeholder="Придумайте пароль (мин. 6 символов)"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Подтверждение пароля:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength="6"
            placeholder="Повторите пароль"
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войдите здесь</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;