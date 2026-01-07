import express from "express";
import passport from "../passport.js"; // ✅ MUST use local passport
import jwt from "jsonwebtoken";

const router = express.Router();

/* ============================================================
   GOOGLE OAUTH — CUSTOMER
   GET /api/customers/auth/google
============================================================ */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/auth/google",
    passport.authenticate("customer-google", {
      scope: ["profile", "email"],
    })
  );
} else {
  router.get("/auth/google", (req, res) => {
    res.status(503).send("Google OAuth not configured on server");
  });
}

/* ============================================================
   GOOGLE OAUTH CALLBACK — CUSTOMER
   GET /api/customers/auth/google/callback
============================================================ */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/auth/google/callback",
    passport.authenticate("customer-google", {
      failureRedirect: "/login",
      session: true,
    }),
    (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!req.user) {
      return res.status(500).send("Customer not found after OAuth");
    }

    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: "customer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.redirect(
      `${frontendUrl}/oauth-success?token=${token}&role=customer`
    );
  }
  );
} else {
  router.get("/auth/google/callback", (req, res) => {
    res.status(503).send("Google OAuth not configured on server");
  });
}

export default router;
