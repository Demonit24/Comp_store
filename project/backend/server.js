import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, models } from './models/index.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import branchRoutes from './routes/branches.js';
import saleRoutes from './routes/sales.js';
import supplierRoutes from './routes/suppliers.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Добавляем модели в каждый запрос
app.use((req, res, next) => {
  console.log('Adding models to request:', Object.keys(models)); // Лог для отладки
  req.models = models;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database sync error:', error);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await syncDatabase();
});