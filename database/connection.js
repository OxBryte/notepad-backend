// database/connection.js
const { Pool } = require('pg');
const config = require('../src/config');
const logger = require('../src/utils/logger');

// Database configuration
const dbConfig = {
  user: config.database.user,
  host: config.database.host,
  database: config.database.name,
  password: config.database.password,
  port: config.database.port,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: config.database.poolSize,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'public_notepad_api',
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error acquiring client', err.stack);
    return;
  }
  logger.info('Database connected successfully');
  release();
});

// Database query helper with error handling and logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (over 1 second)
    if (duration > 1000) {
      logger.warn('Slow query detected:', { 
        text: text.substring(0, 100) + '...', 
        duration, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100) + '...',
      params: params ? params.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p) : null,
      duration
    });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    logger.info('Transaction completed successfully');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  query,
  transaction,
  healthCheck,
  pool,
  gracefulShutdown
};