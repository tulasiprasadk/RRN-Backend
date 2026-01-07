import express from 'express';
const router = express.Router();

router.get('/status', (req, res) => {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return res.json({ googleConfigured, frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173' });
});

export default router;
