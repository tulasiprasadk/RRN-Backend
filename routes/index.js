import express from "express";
import products from "./products.js";
import categories from "./categories.js";
import ads from "./ads.js";
import admin from "./admin.js";
import suppliers from "./suppliers.js";
import supplierProducts from "./supplier/products.js";
import customers from "./customers.js";

const router = express.Router();


router.use("/products", products);
router.use("/categories", categories);
router.use("/ads", ads);
router.use("/admin", admin);
router.use("/suppliers", suppliers);
router.use("/supplier/products", supplierProducts);
router.use("/customers", customers);

export default router;
