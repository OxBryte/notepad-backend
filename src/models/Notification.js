// src/models/Notification.js
const pool = require('../config/database');
const logger = require('../utils/logger');

class Notification {
  static async create(notificationData) {
    try {
      const { 
        userId, 
        type, 
        title, 
        content = null, 
        relatedUserId = null, 
        relatedIdeaId = null 
      } = notificationData;

      const result = await pool.query(`
        INSERT INTO notifications (user_id, type, title, content, related_user_id, related_idea_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [userId, type, title, content, relatedUserId, relatedIdeaId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  static async findByUser(userId, filters = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = filters;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          n.*,
          ru.username as related_username,
          ri.title as related_idea_title
        FROM notifications n
        LEFT JOIN users ru ON n.related_user_id = ru.id
        LEFT JOIN ideas ri ON n.related_idea_id = ri.id
        WHERE n.user_id = $1
      `;
      const params = [userId];

      if (unreadOnly) {
        query += ' AND n.is_read = false';
      }

      query += ' ORDER BY n.created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1';
      const countParams = [userId];

      if (unreadOnly) {
        countQuery += ' AND is_read = false';
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding notifications by user:', error);
      throw error;
    }
  }

  static async markAsRead(id, userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id',
        [userId]
      );
      return result.rows.length;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = Notification;