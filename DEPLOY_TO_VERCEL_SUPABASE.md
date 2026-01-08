Deployment steps for Vercel (frontend + backend) and Supabase

Overview
- Frontend: deploy the `frontend` folder to Vercel (static build produced by `vite build`).
- Backend: deploy the `backend` folder to Vercel as a Serverless function (uses `api/index.js`).
- Database: use Supabase Postgres; set `DATABASE_URL` in Vercel's Environment Variables.

Required environment variables (backend on Vercel)
- `DATABASE_URL` — full Postgres connection string (example: `postgres://user:pass@host:5432/postgres`).
- `DB_SSL` — set to `true` when using Supabase (ensures `rejectUnauthorized=false` is used).
- `SESSION_SECRET` — random string for express-session.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — OAuth credentials.
- `GOOGLE_SUPPLIER_CALLBACK_URL` and `GOOGLE_CUSTOMER_CALLBACK_URL` — callback URLs that match Google Console (e.g. `https://<backend-domain>/api/suppliers/auth/google/callback`).
- `CORS_ORIGINS` — comma-separated list including your frontend URL (e.g. `https://your-frontend.vercel.app`).

Frontend environment (Vercel)
- `VITE_API_BASE` — public URL of backend without trailing `/api` (e.g. `https://your-backend.vercel.app`).

Recommended Vercel configuration
1. Create two separate Projects in Vercel (recommended):
   - Project A: frontend — set Root Directory to `frontend`, Build Command `npm run build`, Output Directory `dist`.
   - Project B: backend — set Root Directory to `backend`, No Build Command (Vercel will detect serverless functions), or ensure `api/index.js` is the serverless entry.

Alternative (single project / monorepo)
- Use the Vercel dashboard to set Root Directory per project; if you prefer a single GitHub repo, create two Vercel Projects and point them at different root directories.

Deployment checklist
1. Remove any secrets from git history, rotate leaked credentials.
2. Ensure `backend/.env.example` and `frontend/.env.example` exist (they do).
3. Set required Environment Variables in the Vercel dashboard for each project (Production values).
4. Deploy frontend and backend via Vercel; verify `GET /api/db-test` on backend returns `{ ok: true }`.
5. Update Google OAuth console redirect URIs to match your backend `/api/.../callback` endpoints.
6. Verify frontend uses `VITE_API_BASE` matching backend URL; re-deploy frontend after setting env var.

Local testing
1. Run Supabase connection test (backend):
```
cd backend
npm install
DATABASE_URL="postgres://..." DB_SSL=true node scripts/test-pg-conn.mjs
```
2. Run migration (optional):
```
node scripts/migrateSqliteToPostgres.js
```

If you want, provide a Vercel token and I can (with your permission) run `vercel` CLI deploys for both frontend and backend, and create the projects and environment variables automatically. If you prefer, I can instead open a PR with these docs and the small cleanup I already pushed.
