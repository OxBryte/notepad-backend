// src/routes/auth.js
const express = require('express');
const { validate } = require('../middleware/validation');
const { authRateLimiter } = require('../middleware/rateLimit');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { schemas } = require('../middleware/validation');

const router = express.Router();

// Generate nonce for wallet signature
router.post('/nonce', authRateLimiter, authController.generateNonce);

// Login with wallet signature
router.post('/login', authRateLimiter, validate(schemas.login), authController.login);

// Logout (requires authentication)
router.post('/logout', authenticateToken, authController.logout);

// Get current user profile
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;