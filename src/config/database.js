// src/config/database.js - Updated for Neon
const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

// Neon Database configuration
let dbConfig;

if (process.env.DATABASE_URL) {
  // Use connection string (Neon format)
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased for serverless
    application_name: 'public_notepad_api',
  };
} else {
  // Use individual config values
  dbConfig = {
    user: config.database.user,
    host: config.database.host,
    database: config.database.name,
    password: config.database.password,
    port: config.database.port,
    ssl: { rejectUnauthorized: false }, // Required for Neon
    max: config.database.poolSize,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    application_name: 'public_notepad_api',
  };
}

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
});

// Test connection on startup with retry logic for serverless
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('✅ Neon database connected successfully');
      return;
    } catch (err) {
      logger.warn(`Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        logger.error('❌ Failed to connect to Neon database after retries');
        throw err;
      }
      // Wait before retry (important for serverless cold starts)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Test connection on startup
if (process.env.NODE_ENV !== 'test') {
  testConnection().catch(err => {
    logger.error('Failed to establish database connection:', err);
    process.exit(1);
  });
}

// Enhanced query function with retry logic for serverless
const query = async (text, params, retries = 2) => {
  const start = Date.now();
  
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
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
      
      // Check if it's a connection error and we can retry
      if (i < retries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' ||
        error.message.includes('connection')
      )) {
        logger.warn(`Query attempt ${i + 1} failed, retrying...`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      logger.error('Database query error:', {
        error: error.message,
        code: error.code,
        query: text.substring(0, 100) + '...',
        params: params ? params.map(p => 
          typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p
        ) : null,
        duration
      });
      throw error;
    }
  }
};

// Transaction helper with enhanced error handling
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

// Enhanced health check for Neon
const healthCheck = async () => {
  try {
    const result = await query(`
      SELECT 
        NOW() as current_time, 
        version() as pg_version,
        current_database() as database_name,
        current_user as user_name
    `);
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      database: result.rows[0].database_name,
      user: result.rows[0].user_name,
      version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
      provider: 'Neon',
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      provider: 'Neon'
    };
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Closing Neon database pool...');
  await pool.end();
  logger.info('Neon database pool closed');
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