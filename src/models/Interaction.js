// src/models/Interaction.js
const pool = require('../config/database');
const logger = require('../utils/logger');

class Interaction {
  static async create(interactionData) {
    try {
      const { ideaId, userId, type, content = null } = interactionData;

      // For likes, check if already exists and toggle
      if (type === 'like') {
        const existing = await pool.query(
          'SELECT id FROM interactions WHERE idea_id = $1 AND user_id = $2 AND interaction_type = $3',
          [ideaId, userId, 'like']
        );

        if (existing.rows.length > 0) {
          // Unlike
          await pool.query(
            'DELETE FROM interactions WHERE id = $1',
            [existing.rows[0].id]
          );
          return { action: 'unliked' };
        }
      }

      const result = await pool.query(`
        INSERT INTO interactions (idea_id, user_id, interaction_type, content, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [ideaId, userId, type, content]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating interaction:', error);
      throw error;
    }
  }

  static async findByIdea(ideaId, type = null) {
    try {
      let query = `
        SELECT 
          i.*,
          u.wallet_address,
          u.username
        FROM interactions i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.idea_id = $1
      `;
      const params = [ideaId];

      if (type) {
        query += ' AND i.interaction_type = $2';
        params.push(type);
      }

      query += ' ORDER BY i.created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding interactions by idea:', error);
      throw error;
    }
  }

  static async getUserInteraction(ideaId, userId, type) {
    try {
      const result = await pool.query(
        'SELECT * FROM interactions WHERE idea_id = $1 AND user_id = $2 AND interaction_type = $3',
        [ideaId, userId, type]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user interaction:', error);
      throw error;
    }
  }

  static async getStats(ideaId) {
    try {
      const result = await pool.query(`
        SELECT 
          interaction_type,
          COUNT(*) as count
        FROM interactions 
        WHERE idea_id = $1 
        GROUP BY interaction_type
      `, [ideaId]);

      const stats = {
        likes: 0,
        comments: 0,
        builds: 0,
        shares: 0
      };

      result.rows.forEach(row => {
        stats[row.interaction_type + 's'] = parseInt(row.count);
      });

      return stats;
    } catch (error) {
      logger.error('Error getting interaction stats:', error);
      throw error;
    }
  }
}

module.exports = Interaction;