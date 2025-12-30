import express from "express";
import { models } from "../../config/database.js";
const { Order, Address } = models;
const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session?.customerId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

router.get("/", requireLogin, async (req, res) => {
  try {
    const customerId = req.session.customerId;

    const [ordersCount, addressesCount] = await Promise.all([
      Order.count({ where: { CustomerId: customerId } }),
      Address.count({ where: { CustomerId: customerId } })
    ]);

    res.json({
      orders: ordersCount,
      saved: 0, // saved suppliers/bookmarks not tracked yet
      addresses: addressesCount
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

export default router;
