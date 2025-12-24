const express = require('express');
const passport = require('passport');
const router = express.Router();

// Start Google OAuth for user
router.get('/auth/google',
  passport.authenticate('customer-google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/auth/google/callback',
  passport.authenticate('customer-google', {
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    // Redirect to homepage or dashboard after login
    res.redirect('/');
  }
);

module.exports = router;
