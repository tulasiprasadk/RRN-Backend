
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import customerRoutes from "./customer/index.js";

const router = express.Router();

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('customer-google', { scope: ['profile', 'email'] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("supplier-google", {
    failureRedirect: "/supplier/login",
    session: true,
  }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL;

    if (req.user && req.user.status === "approved") {
      return res.redirect(`${frontendUrl}/supplier/dashboard`);
    } else {
      return res.redirect(`${frontendUrl}/supplier/login?pending=1`);
    }
  }
);


// Mount all other customer routes
router.use('/', customerRoutes);

export default router;
