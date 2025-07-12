
// src/middleware/errorHandler.js
const logger = require('../utils/logger');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Database errors
  if (err.code === '23505') {
    error.message = 'Duplicate entry found';
    error.statusCode = 409;
  }

  if (err.code === '23503') {
    error.message = 'Referenced record not found';
    error.statusCode = 400;
  }

  if (err.code === '23514') {
    error.message = 'Data validation failed';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.statusCode = 400;
  }

  // IPFS errors
  if (err.message.includes('IPFS')) {
    error.message = 'Failed to store metadata';
    error.statusCode = 503;
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 413;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    error.statusCode = 400;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};

const notFound = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};