const express = require('express');
const passport = require('passport');
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
    // Generate JWT token (minimal, for demo; use a real secret in production)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: 'user' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=user`);
  }
);

// Mount all other customer routes (auth, address, cart, etc.)
router.use('/', require('./customer'));

module.exports = router;
