import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all products with filtering and sorting
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { Product, Supplier } = req.models;
    const { 
      category, 
      name, 
      minPrice, 
      maxPrice, 
      inStock,
      supplierId,
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      page = 1, 
      limit = 10 
    } = req.query;

    console.log('GET /api/products - Start with filters:', req.query);

    // Build where conditions
    const where = {};
    
    if (category) where.category = category;
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (minPrice || maxPrice) {
      where.sellingPrice = {};
      if (minPrice) where.sellingPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.sellingPrice[Op.lte] = parseFloat(maxPrice);
    }
    if (inStock === 'true') where.quantity = { [Op.gt]: 0 };
    if (inStock === 'false') where.quantity = { [Op.eq]: 0 };
    if (supplierId) where.supplierId = supplierId;

    // Build order
    const order = [];
    const sortFields = {
      name: 'name',
      category: 'category',
      costPrice: 'cost_price',
      sellingPrice: 'selling_price',
      quantity: 'quantity',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };

    if (sortFields[sortBy]) {
      if (Array.isArray(sortFields[sortBy])) {
        // For calculated fields, use literal SQL
        order.push([sequelize.literal(sortFields[sortBy].join(' ')), sortOrder]);
      } else {
        order.push([sortFields[sortBy], sortOrder]);
      }
    } else {
      order.push(['created_at', 'DESC']);
    }

    const offset = (page - 1) * limit;

    console.log('Database query conditions:', where);
    console.log('Sort order:', order);

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'companyName', 'contactPerson']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
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
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get available categories for filtering
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { Product } = req.models;
    
    const categories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true
    });

    const categoryList = categories.map(item => item.category);
    res.json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
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