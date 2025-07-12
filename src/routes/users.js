// src/routes/users.js
const express = require('express');
const { validate, validateQuery, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Search users
router.get('/search', validateQuery(schemas.search), userController.searchUsers);

// Get user by wallet address
router.get('/:address', optionalAuth, userController.getUser);

// Update user profile
router.put('/:address', authenticateToken, validate(schemas.updateUser), userController.updateProfile);

// Get user's ideas
router.get('/:address/ideas', validateQuery(schemas.pagination), userController.getUserIdeas);

module.exports = router;
