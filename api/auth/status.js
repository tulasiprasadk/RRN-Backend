export default function handler(req, res) {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify({ googleConfigured, frontendUrl }));
}
