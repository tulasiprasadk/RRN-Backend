
import express from 'express';
import { AnalyticsVisit } from '../models/index.js';
const router = express.Router();

// CREATE visit log
router.post('/', async (req, res) => {
  try {
    const visit = await AnalyticsVisit.create(req.body);
    res.json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all visits
router.get('/', async (req, res) => {
  try {
    const visits = await AnalyticsVisit.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(visits);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
