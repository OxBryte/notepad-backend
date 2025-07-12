// src/utils/helpers.js
const crypto = require('crypto');

const validateWalletAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const validateTransactionHash = (hash) => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
};

const formatWalletAddress = (address) => {
  if (!validateWalletAddress(address)) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

const paginate = (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (parsedPage - 1) * parsedLimit;
  
  return { page: parsedPage, limit: parsedLimit, offset };
};

const buildPaginationResponse = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

module.exports = {
  validateWalletAddress,
  validateTransactionHash,
  generateRandomString,
  sanitizeString,
  formatWalletAddress,
  sleep,
  isValidEmail,
  isValidUrl,
  sanitizeFilename,
  paginate,
  buildPaginationResponse
};