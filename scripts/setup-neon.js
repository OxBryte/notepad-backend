// scripts/setup-neon.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function setupNeonDatabase() {
  console.log('🌟 Setting up Neon database for Public Notepad...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please add your Neon connection string to .env file:');
    console.log('DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('🔌 Testing Neon connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    client.release();
    
    console.log('✅ Connected to Neon successfully!');
    console.log(`📅 Server time: ${result.rows[0].now}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`);

    // Check if schema already exists
    const schemaCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (schemaCheck.rows.length > 0) {
      console.log('📋 Database schema already exists!');
      
      // Show current state
      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM ideas) as ideas,
          (SELECT COUNT(*) FROM interactions) as interactions,
          (SELECT COUNT(*) FROM notifications) as notifications
      `);
      
      console.log('📊 Current database state:');
      console.log(`  👥 Users: ${stats.rows[0].users}`);
      console.log(`  💡 Ideas: ${stats.rows[0].ideas}`);
      console.log(`  💬 Interactions: ${stats.rows[0].interactions}`);
      console.log(`  🔔 Notifications: ${stats.rows[0].notifications}`);
      
      return;
    }

    // Read and execute schema
    console.log('📄 Creating database schema...');
    const schemaPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      // Create a simplified schema for testing
      console.log('📝 Creating basic schema...');
      await createBasicSchema(pool);
    } else {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      await executeSchemaStatements(pool, schemaSQL);
    }

    console.log('✅ Schema created successfully!');

    // Optional: Add sample data
    const addSampleData = process.argv.includes('--seed');
    if (addSampleData) {
      console.log('🌱 Adding sample data...');
      await addSampleData(pool);
      console.log('✅ Sample data added!');
    }

    console.log('🎉 Neon database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run dev');
    console.log('3. Test: curl http://localhost:3001/api/health');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('💡 Check your DATABASE_URL credentials');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Verify your database name in the connection string');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Check your internet connection and Neon endpoint');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function createBasicSchema(pool) {
  const basicSchema = `
    -- Basic schema for Public Notepad
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(42) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE,
      bio TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE ideas (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'general',
      tags TEXT[] DEFAULT '{}',
      ipfs_hash VARCHAR(100),
      token_id BIGINT,
      transaction_hash VARCHAR(66),
      contract_address VARCHAR(42),
      minted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE interactions (
      id SERIAL PRIMARY KEY,
      idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'comment', 'build', 'share')),
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      related_idea_id INTEGER REFERENCES ideas(id) ON DELETE SET NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX idx_users_wallet_address ON users(wallet_address);
    CREATE INDEX idx_ideas_user_id ON ideas(user_id);
    CREATE INDEX idx_ideas_category ON ideas(category);
    CREATE INDEX idx_ideas_created_at ON ideas(created_at);
    CREATE INDEX idx_interactions_idea_id ON interactions(idea_id);
    CREATE INDEX idx_interactions_user_id ON interactions(user_id);
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
  `;

  await executeSchemaStatements(pool, basicSchema);
}

async function executeSchemaStatements(pool, sql) {
  const statements = sql
    .split(';')
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => stmt.trim() + ';');

  for (let i = 0; i < statements.length; i++) {
    try {
      await pool.query(statements[i]);
      process.stdout.write(`Progress: ${i + 1}/${statements.length}\r`);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw new Error(`Statement ${i + 1} failed: ${error.message}`);
      }
    }
  }
  console.log(); // New line after progress
}

async function addSampleData(pool) {
  // Add a few sample users and ideas
  const sampleUsers = [
    {
      wallet: '0x1234567890123456789012345678901234567890',
      username: 'alice_innovator',
      bio: 'Building the future with blockchain'
    },
    {
      wallet: '0x2345678901234567890123456789012345678901',
      username: 'bob_builder',
      bio: 'Full-stack developer passionate about Web3'
    }
  ];

  for (const user of sampleUsers) {
    await pool.query(`
      INSERT INTO users (wallet_address, username, bio)
      VALUES ($1, $2, $3)
      ON CONFLICT (wallet_address) DO NOTHING
    `, [user.wallet, user.username, user.bio]);
  }

  // Add sample idea
  const userResult = await pool.query('SELECT id FROM users LIMIT 1');
  if (userResult.rows.length > 0) {
    await pool.query(`
      INSERT INTO ideas (user_id, title, content, category, tags)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      userResult.rows[0].id,
      'Welcome to Public Notepad!',
      'This is your first idea on the decentralized notepad. Share your innovative thoughts and help build the future!',
      'general',
      ['welcome', 'blockchain', 'ideas']
    ]);
  }
}

// Connection test utility
async function testNeonConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    return false;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Neon connection successful');
    return true;
  } catch (error) {
    console.error('❌ Neon connection failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  if (process.argv.includes('--test')) {
    testNeonConnection();
  } else {
    setupNeonDatabase();
  }
}

module.exports = { setupNeonDatabase, testNeonConnection };