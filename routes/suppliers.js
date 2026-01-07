import express from "express";
import passport from "../passport.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

import { models } from "../config/database.js";
const { Supplier, Product, Order } = models;

import adminNotify from "../services/adminNotify.js";
import { sendOTP as sendOTPSMS } from "../services/smsService.js";

const router = express.Router();

/* ============================================================
   GOOGLE OAUTH — SUPPLIER
   GET /api/suppliers/auth/google
============================================================ */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/auth/google",
    passport.authenticate("supplier-google", {
      scope: ["profile", "email"],
    })
  );
} else {
  router.get("/auth/google", (req, res) => {
    res.status(503).send("Google OAuth not configured on server");
  });
}

/* ============================================================
   GOOGLE OAUTH CALLBACK — SUPPLIER
   GET /api/suppliers/auth/google/callback
============================================================ */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/auth/google/callback",
    passport.authenticate("supplier-google", {
      failureRedirect: "/supplier/login",
      session: true,
    }),
    (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!req.user) {
      return res.status(500).send("Supplier not found after OAuth");
    }

    if (req.user.status === "approved") {
      return res.redirect(`${frontendUrl}/supplier/dashboard`);
    }

    return res.redirect(`${frontendUrl}/supplier/login?pending=1`);
  }
  );
} else {
  router.get("/auth/google/callback", (req, res) => {
    res.status(503).send("Google OAuth not configured on server");
  });
}

/* ============================================================
   MULTER CONFIG — KYC UPLOADS
============================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/kyc/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ============================================================
   SUPPLIER LOGIN — OTP / PASSWORD
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { phone, password, otp } = req.body;

    const supplier = await Supplier.findOne({ where: { phone } });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    if (supplier.status !== "approved") {
      return res.status(403).json({
        error: "Account not approved",
        status: supplier.status,
      });
    }

    if (otp) {
      if (!supplier.otp || supplier.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      await supplier.update({ otp: null, otpExpiry: null });
    } else if (password) {
      const ok = await bcrypt.compare(password, supplier.password);
      if (!ok) {
        return res.status(400).json({ error: "Invalid password" });
      }
    } else {
      return res.status(400).json({ error: "OTP or password required" });
    }

    req.session.supplierId = supplier.id;

    return res.json({
      ok: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
      },
    });
  } catch (err) {
    console.error("Supplier login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   SUPPLIER PRODUCTS
============================================================ */
router.get("/:id/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { SupplierId: req.params.id },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   SUPPLIER ORDERS
============================================================ */
router.get("/:id/orders", async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { SupplierId: req.params.id },
      include: [Product],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
