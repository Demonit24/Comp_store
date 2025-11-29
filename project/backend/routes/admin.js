import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Middleware для проверки прав администратора
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Требуются права администратора' });
  }
  next();
};

// Получить всех пользователей
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { User } = req.models;
    
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Ошибка при загрузке пользователей' });
  }
});

// Создать нового пользователя
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { User } = req.models;
    const { login, password, email, role, branchId } = req.body;

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ login }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Пользователь с таким логином или email уже существует' 
      });
    }

    // Создание пользователя
    const user = await User.create({
      login,
      password,
      email,
      role: role || 'branch_manager',
      branchId: role === 'branch_manager' ? branchId : null
    });

    // Возвращаем пользователя без пароля
    const userWithoutPassword = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      message: 'Пользователь успешно создан',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Ошибка при создании пользователя' });
  }
});

// Обновить пользователя
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { User } = req.models;
    const { id } = req.params;
    const { login, email, role, branchId, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверка уникальности логина и email
    if (login || email) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            login && { login },
            email && { email }
          ].filter(Boolean),
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Пользователь с таким логином или email уже существует' 
        });
      }
    }

    // Обновление данных
    const updateData = {};
    if (login) updateData.login = login;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (branchId !== undefined) updateData.branchId = role === 'branch_manager' ? branchId : null;
    if (password) updateData.password = password;

    await user.update(updateData);

    // Возвращаем обновленного пользователя без пароля
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'Пользователь успешно обновлен',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
  }
});

// Удалить пользователя
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { User } = req.models;
    const { id } = req.params;

    // Нельзя удалить самого себя
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Нельзя удалить собственный аккаунт' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await user.destroy();

    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Ошибка при удалении пользователя' });
  }
});

export default router;