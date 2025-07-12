// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

// General API rate limiter
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  }
});

// Strict rate limiter for minting operations
const mintRateLimiter = rateLimit({
  windowMs: config.rateLimit.mintWindowMs,
  max: config.rateLimit.mintMaxRequests,
  message: {
    success: false,
    error: 'Too many minting requests, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.mintWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP and user ID if authenticated
    return req.user ? `${req.ip}-${req.user.id}` : req.ip;
  },
  handler: (req, res) => {
    logger.warn('Mint rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many minting requests, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.mintWindowMs / 1000)
    });
  }
});

// Auth rate limiter (more restrictive for login attempts)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  rateLimiter,
  mintRateLimiter,
  authRateLimiter
};