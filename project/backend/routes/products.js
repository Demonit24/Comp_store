import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { Product, Supplier } = req.models;
    const { category, page = 1, limit = 10 } = req.query;
    
    console.log('GET /api/products - Start');
    console.log('Query params:', { category, page, limit });
    
    const where = {};
    if (category) where.category = category;
    
    const offset = (page - 1) * limit;
    
    console.log('Database query conditions:', where);
    
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'companyName', 'contactPerson']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${count} products, returning ${products.length}`);
    
    // Add computed fields
    const productsWithComputed = products.map(product => {
      const productJSON = product.toJSON();
      return {
        ...productJSON,
        profitMargin: product.getProfitMargin(),
        profitability: product.getProfitability()
      };
    });

    res.json({
      products: productsWithComputed,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
    
    console.log('GET /api/products - Success');
  } catch (error) {
    console.error('GET /api/products - Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { Product, Supplier } = req.models;
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'companyName', 'contactPerson']
      }]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const productJSON = product.toJSON();
    res.json({
      ...productJSON,
      profitMargin: product.getProfitMargin(),
      profitability: product.getProfitability()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { Product, Supplier } = req.models;
    
    console.log('Received product data:', req.body);
    console.log('User making request:', req.user.id);
    
    const product = await Product.create(req.body);
    console.log('Product created with ID:', product.id);
    
    const populatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'companyName', 'contactPerson']
      }]
    });
    
    console.log('Populated product:', populatedProduct.toJSON());
    
    const productJSON = populatedProduct.toJSON();
    res.status(201).json({
      ...productJSON,
      profitMargin: populatedProduct.getProfitMargin(),
      profitability: populatedProduct.getProfitability()
    });
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error details:', error.errors);
    res.status(400).json({ 
      message: error.message,
      details: error.errors 
    });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { Product, Supplier } = req.models;
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.update(req.body);
    
    const updatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'companyName', 'contactPerson']
      }]
    });
    
    const productJSON = updatedProduct.toJSON();
    res.json({
      ...productJSON,
      profitMargin: updatedProduct.getProfitMargin(),
      profitability: updatedProduct.getProfitability()
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { Product } = req.models;
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.destroy();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profitability stats
router.get('/stats/profitability', authenticateToken, async (req, res) => {
  try {
    const { Product } = req.models;
    const products = await Product.findAll();
    
    const stats = products.map(product => ({
      id: product.id,
      name: product.name,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      profitMargin: product.getProfitMargin(),
      profitability: product.getProfitability(),
      quantity: product.quantity
    }));
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;