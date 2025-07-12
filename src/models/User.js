// src/models/User.js
const pool = require('../config/database');
const logger = require('../utils/logger');

class User {
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT id, wallet_address, username, bio, avatar_url, created_at, last_login FROM users WHERE id = $1 AND is_active = true',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByWalletAddress(walletAddress) {
    try {
      const result = await pool.query(
        'SELECT id, wallet_address, username, bio, avatar_url, created_at, last_login FROM users WHERE wallet_address = $1 AND is_active = true',
        [walletAddress.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by wallet address:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT id, wallet_address, username, bio, avatar_url, created_at, last_login FROM users WHERE username = $1 AND is_active = true',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { walletAddress, username = null, bio = null, avatarUrl = null } = userData;
      
      const result = await pool.query(`
        INSERT INTO users (wallet_address, username, bio, avatar_url, created_at, last_login)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, wallet_address, username, bio, avatar_url, created_at, last_login
      `, [walletAddress.toLowerCase(), username, bio, avatarUrl]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const allowedFields = ['username', 'bio', 'avatar_url'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount} AND is_active = true
        RETURNING id, wallet_address, username, bio, avatar_url, created_at, last_login
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async updateLastLogin(id) {
    try {
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [id]
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  static async getUserStats(id) {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.wallet_address,
          u.username,
          COUNT(DISTINCT i.id) as ideas_count,
          COUNT(DISTINCT CASE WHEN i.minted_at IS NOT NULL THEN i.id END) as minted_ideas_count,
          COUNT(DISTINCT int_given.id) as interactions_given,
          COUNT(DISTINCT int_received.id) as interactions_received,
          COUNT(DISTINCT f1.id) as followers_count,
          COUNT(DISTINCT f2.id) as following_count
        FROM users u
        LEFT JOIN ideas i ON u.id = i.user_id AND i.is_active = true
        LEFT JOIN interactions int_given ON u.id = int_given.user_id
        LEFT JOIN interactions int_received ON i.id = int_received.idea_id
        LEFT JOIN follows f1 ON u.id = f1.following_id
        LEFT JOIN follows f2 ON u.id = f2.follower_id
        WHERE u.id = $1 AND u.is_active = true
        GROUP BY u.id, u.wallet_address, u.username
      `, [id]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  static async deactivate(id) {
    try {
      const result = await pool.query(
        'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }
}

module.exports = User;