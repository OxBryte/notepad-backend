// src/middleware/auth.js
const { verifyToken } = require('../config/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      walletAddress: decoded.walletAddress,
      ...user
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false,
        error: 'Token expired' 
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          id: decoded.userId,
          walletAddress: decoded.walletAddress,
          ...user
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    logger.warn('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};