// src/models/Idea.js
const pool = require('../config/database');
const logger = require('../utils/logger');

class Idea {
  static async findById(id) {
    try {
      const result = await pool.query(`
        SELECT 
          i.*,
          u.wallet_address,
          u.username,
          COUNT(DISTINCT CASE WHEN int.interaction_type = 'like' THEN int.id END) as likes_count,
          COUNT(DISTINCT CASE WHEN int.interaction_type = 'comment' THEN int.id END) as comments_count,
          COUNT(DISTINCT CASE WHEN int.interaction_type = 'build' THEN int.id END) as builds_count
        FROM ideas i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN interactions int ON i.id = int.idea_id
        WHERE i.id = $1 AND i.is_active = true
        GROUP BY i.id, u.wallet_address, u.username
      `, [id]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding idea by ID:', error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'created_at',
        order = 'desc',
        search,
        category,
        tags,
        author,
        minted
      } = filters;

      const offset = (page - 1) * limit;
      const conditions = ['i.is_active = true'];
      const params = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (search) {
        conditions.push(`(i.title ILIKE $${paramCount} OR i.content ILIKE $${paramCount})`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (category) {
        conditions.push(`i.category = $${paramCount}`);
        params.push(category);
        paramCount++;
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        conditions.push(`i.tags && $${paramCount}`);
        params.push(tagArray);
        paramCount++;
      }

      if (author) {
        conditions.push(`u.wallet_address = $${paramCount}`);
        params.push(author.toLowerCase());
        paramCount++;
      }

      if (minted === 'true') {
        conditions.push('i.minted_at IS NOT NULL');
      } else if (minted === 'false') {
        conditions.push('i.minted_at IS NULL');
      }

      const validSorts = ['created_at', 'updated_at', 'minted_at', 'interaction_count'];
      const sortBy = validSorts.includes(sort) ? sort : 'created_at';
      const orderBy = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      const query = `
        SELECT 
          i.*,
          u.wallet_address,
          u.username,
          COUNT(DISTINCT int.id) as interaction_count,
          COUNT(DISTINCT CASE WHEN int.interaction_type = 'like' THEN int.id END) as likes_count,
          COUNT(DISTINCT CASE WHEN int.interaction_type = 'comment' THEN int.id END) as comments_count,
          COUNT(DISTINCT CASE WHEN int.interaction_type = 'build' THEN int.id END) as builds_count
        FROM ideas i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN interactions int ON i.id = int.idea_id
        WHERE ${conditions.join(' AND ')}
        GROUP BY i.id, u.wallet_address, u.username
        ORDER BY ${sortBy === 'interaction_count' ? 'interaction_count' : `i.${sortBy}`} ${orderBy}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      params.push(limit, offset);
      const result = await pool.query(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT i.id) as total
        FROM ideas i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE ${conditions.join(' AND ')}
      `;
      
      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      return {
        ideas: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding ideas:', error);
      throw error;
    }
  }

  static async create(ideaData) {
    try {
      const { userId, title, content, category = 'general', tags = [], ipfsHash } = ideaData;

      const result = await pool.query(`
        INSERT INTO ideas (user_id, title, content, category, tags, ipfs_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [userId, title, content, category, tags, ipfsHash]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating idea:', error);
      throw error;
    }
  }

  static async updateMintInfo(id, userId, mintData) {
    try {
      const { tokenId, transactionHash, contractAddress } = mintData;

      const result = await pool.query(`
        UPDATE ideas 
        SET token_id = $1, transaction_hash = $2, contract_address = $3, minted_at = NOW()
        WHERE id = $4 AND user_id = $5 AND is_active = true
        RETURNING *
      `, [tokenId, transactionHash, contractAddress, id, userId]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating mint info:', error);
      throw error;
    }
  }

  static async findByUser(userId, filters = {}) {
    try {
      const { page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const result = await pool.query(`
        SELECT 
          i.*,
          u.wallet_address,
          u.username,
          COUNT(DISTINCT int.id) as interaction_count
        FROM ideas i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN interactions int ON i.id = int.idea_id
        WHERE i.user_id = $1 AND i.is_active = true
        GROUP BY i.id, u.wallet_address, u.username
        ORDER BY i.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM ideas WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      return {
        ideas: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding ideas by user:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const result = await pool.query(
        'UPDATE ideas SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error deleting idea:', error);
      throw error;
    }
  }
}

module.exports = Idea;