import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize'; // Добавьте этот импорт
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { User } = req.models;
    const { login, password, email } = req.body;

    console.log('Registration attempt:', { login, email, passwordLength: password?.length });

    // Check if user exists - ИСПРАВЛЕННЫЙ КОД
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [ // Используем Op.or вместо $or
          { login: login },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      console.log('User already exists:', { login, email });
      return res.status(400).json({ 
        message: 'Пользователь с таким логином или email уже существует' 
      });
    }

    // Create new user
    const user = await User.create({
      login,
      password,
      email
    });

    console.log('User created successfully:', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Пользователь успешно создан',
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Login - тоже нужно исправить если есть похожая проблема
router.post('/login', async (req, res) => {
  try {
    const { User } = req.models;
    const { login, password } = req.body;

    console.log('Login attempt:', { login });

    // Find user
    const user = await User.findOne({ 
      where: { login: login } // Простое условие
    });
    
    if (!user) {
      console.log('User not found:', login);
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', login);
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    console.log('Login successful:', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        role: user.role,
        branchId: user.branchId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      login: req.user.login,
      email: req.user.email,
      role: req.user.role,
      branchId: user.branchId
    }
  });
});

export default router;