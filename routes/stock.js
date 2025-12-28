
import express from 'express';
import { StockHistory } from '../models/index.js';
const router = express.Router();

// GET stock history
router.get('/', async (req, res) => {
  try {
    const logs = await StockHistory.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADD stock record
router.post('/', async (req, res) => {
  try {
    const log = await StockHistory.create(req.body);
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
