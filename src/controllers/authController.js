// src/controllers/authController.js
const { ethers } = require('ethers');
const { generateToken } = require('../config/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const verifyWalletSignature = (message, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
};

const login = asyncHandler(async (req, res) => {
  const { walletAddress, signature, message } = req.body;

  // Verify the signature
  if (!verifyWalletSignature(message, signature, walletAddress)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid signature'
    });
  }

  // Find or create user
  let user = await User.findByWalletAddress(walletAddress);
  
  if (!user) {
    user = await User.create({ walletAddress });
    logger.info('New user created:', { userId: user.id, walletAddress });
  } else {
    await User.updateLastLogin(user.id);
    logger.info('User logged in:', { userId: user.id, walletAddress });
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    walletAddress: user.wallet_address
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  // In a production app with Redis, you might want to blacklist the token
  logger.info('User logged out:', { userId: req.user.id });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const stats = await User.getUserStats(req.user.id);

  res.json({
    success: true,
    data: {
      ...user,
      stats
    }
  });
});

const generateNonce = asyncHandler(async (req, res) => {
  const { walletAddress } = req.body;
  
  // Generate a nonce message for the user to sign
  const nonce = Math.floor(Math.random() * 1000000);
  const timestamp = Date.now();
  const message = `Welcome to Public Notepad!\n\nPlease sign this message to authenticate.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

  res.json({
    success: true,
    data: {
      message,
      nonce,
      timestamp
    }
  });
});

module.exports = {
  login,
  logout,
  getProfile,
  generateNonce
};