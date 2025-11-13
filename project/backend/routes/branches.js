import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { Branch, User } = req.models;
    const branches = await Branch.findAll({
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'login', 'email']
      }]
    });
    
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { Branch } = req.models;
    const branch = await Branch.create(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { Branch } = req.models;
    const branch = await Branch.findByPk(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    await branch.update(req.body);
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { Branch } = req.models;
    const branch = await Branch.findByPk(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    await branch.destroy();
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;