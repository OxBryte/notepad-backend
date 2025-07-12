// src/routes/interactions.js
const express = require('express');
const { validate, validateQuery, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const interactionController = require('../controllers/interactionController');

const router = express.Router();

// Create interaction (like, comment, build)
router.post('/ideas/:id', authenticateToken, validate(schemas.interaction), interactionController.createInteraction);

// Get interactions for an idea
router.get('/ideas/:id', optionalAuth, interactionController.getInteractions);

// Get interaction stats for an idea
router.get('/ideas/:id/stats', interactionController.getInteractionStats);

module.exports = router;