// scripts/cleanup.js
const { query, pool } = require('../database/connection');

async function cleanup() {
  console.log('🧹 Cleaning up database...');
  
  try {
    const confirmCleanup = process.argv.includes('--confirm');
    
    if (!confirmCleanup) {
      console.log('⚠️  This will delete ALL data in the database!');
      console.log('Run with --confirm flag to proceed: npm run cleanup -- --confirm');
      return;
    }

    // Drop all tables
    await query('DROP SCHEMA public CASCADE');
    await query('CREATE SCHEMA public');
    await query('GRANT ALL ON SCHEMA public TO postgres');
    await query('GRANT ALL ON SCHEMA public TO public');

    console.log('✅ Database cleaned successfully');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;