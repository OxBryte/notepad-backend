// src/services/authService.js
const { ethers } = require('ethers');
const { generateToken, verifyToken } = require('../config/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

class AuthService {
  static verifyWalletSignature(message, signature, expectedAddress) {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  static generateNonceMessage(walletAddress, nonce, timestamp) {
    return `Welcome to Public Notepad!

Please sign this message to authenticate your wallet.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This signature will not trigger any blockchain transaction or cost any gas.`;
  }

  static async authenticateUser(walletAddress, signature, message) {
    // Verify signature
    if (!this.verifyWalletSignature(message, signature, walletAddress)) {
      throw new Error('Invalid signature');
    }

    // Find or create user
    let user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      user = await User.create({ walletAddress });
      logger.info('New user created during authentication:', { 
        userId: user.id, 
        walletAddress 
      });
    } else {
      await User.updateLastLogin(user.id);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      walletAddress: user.wallet_address
    });

    return { user, token };
  }

  static async validateToken(token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return { user, decoded };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = AuthService;