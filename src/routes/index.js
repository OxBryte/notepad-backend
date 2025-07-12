// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const ideaRoutes = require('./ideas');
const interactionRoutes = require('./interactions');
const notificationRoutes = require('./notifications');
const metadataRoutes = require('./metadata');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/ideas', ideaRoutes);
router.use('/interactions', interactionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/metadata', metadataRoutes);

module.exports = router;