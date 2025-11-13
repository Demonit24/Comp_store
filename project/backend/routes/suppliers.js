import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { Supplier } = req.models;
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = await Supplier.findByPk(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    await supplier.update(req.body);
    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = await Supplier.findByPk(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    await supplier.destroy();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;