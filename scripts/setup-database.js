// scripts/setup-database.js
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../database/connection');
const logger = require('../src/utils/logger');

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Check if database exists and is accessible
    const healthCheck = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📄 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await query(statements[i]);
        process.stdout.write(`Progress: ${i + 1}/${statements.length}\r`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        // Ignore "already exists" errors for idempotent setup
      }
    }

    console.log('\n✅ Database schema created successfully!');
    
    // Verify tables were created
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Verify views
    const viewResult = await query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (viewResult.rows.length > 0) {
      console.log('👀 Created views:');
      viewResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;