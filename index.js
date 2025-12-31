console.log("🔥 INDEX.JS VERSION 2025-12-30");

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
app.use(express.json());

/* =========================
   SESSION + PASSPORT (CRITICAL)
========================= */
app.use(
  session({
    name: "rrnagar.sid",
    secret: process.env.SESSION_SECRET,
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
========================= */
app.use("/api", routes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
});

/* =========================
   INIT DATABASE (NON-BLOCKING)
========================= */
initDatabase();
