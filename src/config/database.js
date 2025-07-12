// src/config/database.js
const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

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
  process.exit(-1);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error acquiring client', err.stack);
    return;
  }
  logger.info('Database connected successfully');
  release();
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Closing database pool...');
  pool.end(() => {
    logger.info('Database pool closed');
  });
});

module.exports = pool;