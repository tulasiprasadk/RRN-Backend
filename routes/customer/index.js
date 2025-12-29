// Importing necessary modules
import express from "express";
import auth from "./auth.js";
import address from "./address.js";
import dashboardStats from "./dashboard-stats.js";
import payment from "./payment.js";
import profile from "./profile.js";
import savedSuppliers from "./saved-suppliers.js";
import cart from "./cart.js";

const router = express.Router();

router.use('/auth', auth);
router.use('/address', address);
router.use('/dashboard-stats', dashboardStats);
router.use('/payment', payment);
router.use('/profile', profile);
router.use('/saved-suppliers', savedSuppliers);
router.use('/cart', cart);

// Exporting the router for use in other modules
export default router;
