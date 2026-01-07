import express from 'express';
import { models } from '../config/database.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const { Category } = models;
    const cats = await Category.findAll({ attributes: ['id', 'name', 'icon'], order: [['id', 'ASC']] });
    res.json(cats.map(c => c.toJSON()));
  } catch (err) {
    console.error('Categories API error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

export default router;
