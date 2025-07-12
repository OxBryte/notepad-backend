// src/controllers/userController.js
const { User, Idea } = require('../models');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getUser = asyncHandler(async (req, res) => {
  const { address } = req.params;
  
  const user = await User.findByWalletAddress(address);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const stats = await User.getUserStats(user.id);

  res.json({
    success: true,
    data: {
      ...user,
      stats
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { address } = req.params;
  
  // Check if user owns this address
  if (req.user.walletAddress !== address.toLowerCase()) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to update this profile'
    });
  }

  const { username, bio, avatarUrl } = req.body;

  // Check if username is already taken
  if (username) {
    const existingUser = await User.findByUsername(username);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Username already taken'
      });
    }
  }

  const updatedUser = await User.update(req.user.id, {
    username,
    bio,
    avatar_url: avatarUrl
  });

  logger.info('User profile updated:', { userId: req.user.id, username });

  res.json({
    success: true,
    data: updatedUser
  });
});

const getUserIdeas = asyncHandler(async (req, res) => {
  const { address } = req.params;
  
  const user = await User.findByWalletAddress(address);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const result = await Idea.findByUser(user.id, req.query);

  res.json({
    success: true,
    data: result
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  
  if (!search || search.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters'
    });
  }

  // This would require implementing a search method in the User model
  // For now, return empty results
  res.json({
    success: true,
    data: {
      users: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    }
  });
});

module.exports = {
  getUser,
  updateProfile,
  getUserIdeas,
  searchUsers
};