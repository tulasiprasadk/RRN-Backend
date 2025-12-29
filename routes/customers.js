
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import customerRoutes from "./customer/index.js";

const router = express.Router();

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('customer-google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('customer-google', {
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: 'user' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=user`);
  }
);

// Mount all other customer routes
router.use('/', customerRoutes);

export default router;
