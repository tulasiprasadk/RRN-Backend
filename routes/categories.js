import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, icon
      FROM "Categories"
      ORDER BY id ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Categories API error:', err.message);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

export default router;
