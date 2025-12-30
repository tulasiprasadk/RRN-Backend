import express from "express";
import { models } from "../../config/database.js";
const { CartItem, Product, Customer, Category } = models;
const router = express.Router();

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.customerId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

// GET /api/cart - Get current user's cart (hydrated)
router.get("/", requireLogin, async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { customerId: req.session.customerId },
      include: [
        {
          model: Product,
          include: [
            {
              model: Category,
              attributes: ["name"]
            }
          ],
          attributes: ["id", "title", "price", "image"]
        }
      ]
    });

    const hydrated = items.map(item => {
      const product = item.Product;
      return {
        id: product?.id,
        title: product?.title,
        price: product?.price,
        image: product?.image,
        category: product?.Category ? product.Category.name : null,
        quantity: item.quantity
      };
    });
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// POST /api/cart/add - Add or update item in cart
router.post("/add", requireLogin, async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10);
  if (!productId || isNaN(qty) || qty < 1) {
    return res.status(400).json({ success: false, error: "Product and quantity required" });
  }
  try {
    // Lookup product and hydrate category
    const product = await Product.findOne({
      where: { id: productId, status: "approved" },
      include: [{ model: Category }],
    });
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    let item = await CartItem.findOne({
      where: { customerId: req.session.customerId, productId },
    });
    if (item) {
      item.quantity += qty;
      await item.save();
    } else {
      item = await CartItem.create({
        customerId: req.session.customerId,
        productId,
        quantity: qty,
      });
    }

    // Hydrate cart for response
    const items = await CartItem.findAll({
      where: { customerId: req.session.customerId },
      include: [{ model: Product, include: [{ model: Category }] }],
    });
    const hydrated = items.map(item => {
      const product = item.Product;
      return {
        id: product?.id,
        title: product?.title,
        titleKannada: product?.titleKannada || null,
        price: product?.price,
        image: product?.image || product?.metadata?.image || null,
        quantity: item.quantity,
        category: product?.Category?.name || null
      };
    });
    res.json({ success: true, cart: hydrated });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to add to bag" });
  }
});

// POST /api/cart/remove - Remove item from cart
router.post("/remove", requireLogin, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: "Product required" });
  try {
    await CartItem.destroy({ where: { customerId: req.session.customerId, productId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

// POST /api/cart/clear - Clear cart
router.post("/clear", requireLogin, async (req, res) => {
  try {
    await CartItem.destroy({ where: { customerId: req.session.customerId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

export default router;
