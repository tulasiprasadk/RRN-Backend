const express = require('express');
const router = express.Router();

// Auth, dashboard, and other customer routes
router.use('/auth', require('./auth'));
router.use('/address', require('./address'));
router.use('/dashboard-stats', require('./dashboard-stats'));
router.use('/payment', require('./payment'));
router.use('/profile', require('./profile'));
router.use('/saved-suppliers', require('./saved-suppliers'));
router.use('/cart', require('./cart'));

module.exports = router;
