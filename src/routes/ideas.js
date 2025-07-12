// src/routes/ideas.js
const express = require('express');
const { validate, validateQuery, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { mintRateLimiter } = require('../middleware/rateLimit');
const ideaController = require('../controllers/ideaController');

const router = express.Router();

// Get all ideas with filtering and pagination
router.get('/', validateQuery(schemas.search), optionalAuth, ideaController.getIdeas);

// Search ideas (handled by the same endpoint as getIdeas)
router.get('/search', validateQuery(schemas.search), optionalAuth, ideaController.searchIdeas);

// Create new idea
router.post('/', authenticateToken, mintRateLimiter, validate(schemas.createIdea), ideaController.createIdea);

// Get specific idea
router.get('/:id', optionalAuth, ideaController.getIdea);

// Update idea with mint information
router.put('/:id/mint', authenticateToken, validate(schemas.updateMintInfo), ideaController.updateMintInfo);

// Delete idea (soft delete)
router.delete('/:id', authenticateToken, ideaController.deleteIdea);

module.exports = router;