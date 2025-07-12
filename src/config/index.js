// src/config/index.js
require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'],

  // Database configuration
 database: {
    // Support for DATABASE_URL (Neon connection string)
    url: process.env.DATABASE_URL,
    // Individual connection parameters (fallback)
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'public_notepad',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: true, // Always true for Neon
    poolSize: process.env.DB_POOL_SIZE || 20,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // IPFS configuration
  ipfs: {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_API_KEY,
    gateway: 'https://gateway.pinata.cloud/ipfs/',
  },

  // Blockchain configuration
  blockchain: {
    baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    baseTestnetRpcUrl: process.env.BASE_TESTNET_RPC_URL || 'https://goerli.base.org',
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    mintWindowMs: parseInt(process.env.MINT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
    mintMaxRequests: parseInt(process.env.MINT_RATE_LIMIT_MAX_REQUESTS) || 5,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  // File upload limits
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // External services
  services: {
    redisUrl: process.env.REDIS_URL,
    sentryDsn: process.env.SENTRY_DSN,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_PASSWORD',
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

module.exports = config;