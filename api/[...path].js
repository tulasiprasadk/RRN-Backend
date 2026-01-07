import serverless from 'serverless-http';
import app from '../index.js';

// This dynamic Vercel serverless function captures all /api/* requests
export default serverless(app);
