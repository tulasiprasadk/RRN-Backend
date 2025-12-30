/**
 * backend/routes/customer/auth.js
 * Customer Authentication Routes
 * ✅ FIXED: OTP stored in DB (no in-memory store)
 */

import express from "express";
import { models } from "../../config/database.js";
const { Customer } = models;
import { sendOTP } from "../../services/emailService.js";
const router = express.Router();

/* =====================================================
   REQUEST EMAIL OTP
   POST /api/auth/request-email-otp
===================================================== */
router.post("/request-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email or username is required" });
  }

  try {
    let customer;

    // Email login OR username (phone)
    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });

      // Auto-create customer if not exists (email flow)
      if (!customer) {
        customer = await Customer.create({ email });
      }
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    if (!customer || !customer.email) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // ✅ SAVE OTP TO DATABASE
    await customer.update({
      otpCode: otp,
      otpExpiresAt: expiresAt,
    });

    // Send OTP email
    await sendOTP(customer.email, otp);

    console.log("📧 OTP SENT:", customer.email, otp);

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* =====================================================
   VERIFY EMAIL OTP
   POST /api/auth/verify-email-otp
===================================================== */
router.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    let customer;

    if (email.includes("@")) {
      customer = await Customer.findOne({ where: { email } });
    } else {
      customer = await Customer.findOne({ where: { username: email } });
    }

    if (!customer || !customer.otpCode) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // Validate OTP + expiry
    if (
      customer.otpCode !== otp ||
      new Date() > customer.otpExpiresAt
    ) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // ✅ CLEAR OTP AFTER SUCCESS
    await customer.update({
      otpCode: null,
      otpExpiresAt: null,
    });

    // Save login session
    req.session.customerId = customer.id;

    res.json({
      success: true,
      message: "OTP verified, logged in",
      customerId: customer.id,
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* =====================================================
   CHECK LOGIN STATUS
   GET /api/auth/me
===================================================== */
router.get("/me", (req, res) => {
  if (!req.session?.customerId) {
    return res.status(401).json({ loggedIn: false });
  }

  // Return full customer object (excluding sensitive fields) as 'user' for frontend consistency
  const { Customer } = require("../../models");
  Customer.findByPk(req.session.customerId, {
    attributes: { exclude: ["otpCode", "otpExpiresAt", "password"] }
  })
    .then(customer => {
      if (!customer) {
        return res.status(401).json({ loggedIn: false });
      }
      res.json({
        loggedIn: true,
        user: customer
      });
    })
    .catch(() => res.status(500).json({ loggedIn: false }));
});

/* =====================================================
   LOGOUT
   POST /api/auth/logout
===================================================== */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("rrnagar.sid");
    res.json({ success: true });
  });
});

export default router;
