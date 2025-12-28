import express from "express";
import auth from "./auth/index.js";
import address from "./address/index.js";
import dashboardStats from "./dashboard-stats/index.js";
import payment from "./payment/index.js";
import profile from "./profile/index.js";
import savedSuppliers from "./saved-suppliers/index.js";
import cart from "./cart/index.js";

const router = express.Router();

router.use('/auth', auth);
router.use('/address', address);
router.use('/dashboard-stats', dashboardStats);
router.use('/payment', payment);
router.use('/profile', profile);
router.use('/saved-suppliers', savedSuppliers);
router.use('/cart', cart);

export default router;
