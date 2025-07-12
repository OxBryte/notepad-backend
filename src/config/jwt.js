// src/config/jwt.js
const jwt = require('jsonwebtoken');
const config = require('./index');

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'public-notepad-api',
    audience: 'public-notepad-client',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'public-notepad-api',
    audience: 'public-notepad-client',
  });
};

const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};