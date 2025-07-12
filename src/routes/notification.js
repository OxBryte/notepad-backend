// src/routes/notifications.js
const express = require('express');
const { validateQuery, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Get user's notifications
router.get('/', authenticateToken, validateQuery(schemas.pagination), notificationController.getNotifications);

// Get unread notification count
router.get('/unread/count', authenticateToken, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

module.exports = router;