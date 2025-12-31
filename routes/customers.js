import express from "express";
import passport from "../passport.js"; // ✅ MUST use local passport
import jwt from "jsonwebtoken";

const router = express.Router();

/* ============================================================
   GOOGLE OAUTH — CUSTOMER
   GET /api/customers/auth/google
============================================================ */
router.get(
  "/auth/google",
  passport.authenticate("customer-google", {
    scope: ["profile", "email"],
  })
);

/* ============================================================
   GOOGLE OAUTH CALLBACK — CUSTOMER
   GET /api/customers/auth/google/callback
============================================================ */
router.get(
  "/auth/google/callback",
  passport.authenticate("customer-google", {
    failureRedirect: "/login",
    session: true,
  }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      return res.status(500).send("FRONTEND_URL not configured");
    }

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

export default router;
