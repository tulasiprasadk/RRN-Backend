import express from "express";
import { models } from "../../config/database.js";
const { Supplier, Order } = models;
const router = express.Router();

/* ======================================
   MIDDLEWARE — Require Login
====================================== */
function requireLogin(req, res, next) {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}


router.get("/", requireLogin, async (req, res) => {
  try {
    const customerId = req.session.customerId;

    // Get unique suppliers from customer's orders
    const orders = await Order.findAll({
      where: { CustomerId: customerId },
      attributes: ["SupplierId"],
      include: [{
        model: Supplier,
        attributes: ["id", "name", "phone", "address", "email"],
      }],
      raw: false,
      subQuery: false
    });

    // Extract unique suppliers
    const supplierMap = {};
    orders.forEach(order => {
      if (order.Supplier && !supplierMap[order.Supplier.id]) {
        supplierMap[order.Supplier.id] = {
          id: order.Supplier.id,
          shopName: order.Supplier.name || order.Supplier.businessName,
          phoneNumber: order.Supplier.phone,
          location: order.Supplier.address,
          email: order.Supplier.email,
          rating: 4.5 // default rating if not available
        };
      }
    });

    const suppliers = Object.values(supplierMap);

    res.json(suppliers);
  } catch (err) {
    console.error("SAVED SUPPLIERS ERROR:", err);
    res.status(500).json({ error: "Failed to load saved suppliers" });
  }
});

export default router;

