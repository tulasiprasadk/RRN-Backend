import serverless from 'serverless-http';
import app from '../index.js';

// Export the serverless handler for Vercel.
// The main Express app lives at `backend/index.js` and is already
// configured to skip `listen()` when `process.env.VERCEL` is set.
export default serverless(app);