console.log("🔥 INDEX.JS VERSION 2025-12-30");

// Load local `.env` during development so running `npm run dev` picks up
// environment variables without extra bootstrapping.
import 'dotenv/config';

import express from "express";
import cors from "cors";
import session from "express-session";

import passport from "./passport.js";
import routes from "./routes/index.js";
import { initDatabase } from "./config/database.js";

const app = express();

/* =========================
   CORS CONFIG
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rrw-frontend.vercel.app",
  "https://rrw-frontend-bshkgchh2-prasads-projects-1f1a36aa.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
========================= */
// Capture raw request body for better JSON parse error diagnostics
app.use(express.json({
  verify: (req, _res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
    } catch (e) {
      req.rawBody = undefined;
    }
  }
}));

// simple request logger in development to help reproduce issues
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[req] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
  });
}

/* =========================
   SESSION + PASSPORT (CRITICAL)
========================= */
// SESSION SECRET: require in production, provide a safe dev fallback locally
const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-me' : undefined);
if (!sessionSecret) {
  console.error('FATAL: SESSION_SECRET is not set. Set SESSION_SECRET in environment for production.');
  process.exit(1);
}
if (sessionSecret === 'dev-secret-change-me') {
  console.warn('Warning: using default development SESSION_SECRET. Set SESSION_SECRET for real deployments.');
}

app.use(
  session({
    name: "rrnagar.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* =========================
   ROUTES
   - When running as a Vercel serverless function the incoming path
     forwarded to the handler is already the part after `/api`.
   - To avoid double `/api` we mount routes at `/` under Vercel,
     and at `/api` for normal servers.
========================= */
// Mount routes at both `/api` and `/` so the server works both when
// running behind a server (where routes live under `/api`) and
// when running as a Vercel serverless function (where forwarded paths
// may or may not include `/api`). This avoids mismatches regardless
// of how the platform forwards the request path.
app.use('/api', routes);
app.use('/', routes);

// centralized error handler to ensure stacktraces reach logs
app.use((err, req, res, next) => {
  try {
    console.error("[error]", new Date().toISOString(), req.method, req.originalUrl);
    console.error(err && err.stack ? err.stack : err);

    // If JSON parsing failed, log the raw body to help debugging
    if (err instanceof SyntaxError && req && req.rawBody !== undefined) {
      console.error('[error] Raw request body:', req.rawBody);
    }
  } catch (logErr) {
    // ignore logging errors
  }

  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.stack ? err.stack : err);
  // don't exit in dev — allow inspector to collect state; in prod you may want to exit
});


/* =========================
   START SERVER (skip when running as Vercel serverless)
========================= */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on port ${PORT}`);
  });
}

/* Export the app for serverless wrappers */
export default app;

/* =========================
   INIT DATABASE (NON-BLOCKING)
========================= */
initDatabase();
