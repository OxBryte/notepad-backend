// src/controllers/metadataController.js
const { getMetadata } = require('../config/ipfs');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getMetadataFromIPFS = asyncHandler(async (req, res) => {
  const { hash } = req.params;
  
  try {
    const metadata = await getMetadata(hash);
    
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    logger.error('Failed to fetch metadata:', { hash, error: error.message });
    res.status(404).json({
      success: false,
      error: 'Metadata not found'
    });
  }
});

const uploadMetadata = asyncHandler(async (req, res) => {
  // This endpoint could be used for uploading custom metadata
  // For now, metadata upload is handled in the idea creation process
  res.status(501).json({
    success: false,
    error: 'Not implemented - metadata upload is handled during idea creation'
  });
});

module.exports = {
  getMetadataFromIPFS,
  uploadMetadata
};

// src/controllers/notificationController.js
const { Notification } = require('../models');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  
  const result = await Notification.findByUser(req.user.id, {
    ...req.query,
    unreadOnly: unreadOnly === 'true'
  });

  res.json({
    success: true,
    data: result
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const updated = await Notification.markAsRead(id, req.user.id);
  
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const count = await Notification.markAllAsRead(req.user.id);
  
  res.json({
    success: true,
    message: `${count} notifications marked as read`
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user.id);
  
  res.json({
    success: true,
    data: { count }
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};