
import express from "express";
import { Order, Product, Address } from "../../models/index.js";
const router = express.Router();

/* Supplier Login Middleware */
function requireSupplier(req, res, next) {
  if (!req.session.supplierId) {
    return res.status(401).json({ error: "Supplier not logged in" });
  }
  next();
}

/* ===========================================================
   GET ALL ORDERS FOR THIS SUPPLIER
=========================================================== */
router.get("/", requireSupplier, async (req, res) => {
  const orders = await Order.findAll({
    where: { supplierId: req.session.supplierId },
    include: [
      { model: Product },
      { model: Address }
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json(orders);
});

/* ===========================================================
   MARK ORDER AS DELIVERED
=========================================================== */
router.put("/:id/deliver", requireSupplier, async (req, res) => {
  const orderId = req.params.id;

  await Order.update(
    { status: "delivered" },
    {
      where: {
        id: orderId,
        supplierId: req.session.supplierId,
      },
    }
  );

  res.json({ success: true, message: "Order marked as delivered" });
});

export default router;
