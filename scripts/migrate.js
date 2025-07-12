// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { query, pool } = require('../database/connection');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of executed migrations
    const executedMigrations = await query('SELECT filename FROM migrations ORDER BY id');
    const executedFiles = new Set(executedMigrations.rows.map(row => row.filename));

    // Read migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let executedCount = 0;

    for (const file of migrationFiles) {
      if (executedFiles.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Executing ${file}...`);
      
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        executedCount++;
        console.log(`✅ Executed ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${error.message}`);
      } finally {
        client.release();
      }
    }

    if (executedCount === 0) {
      console.log('✅ No new migrations to run');
    } else {
      console.log(`✅ Successfully executed ${executedCount} migration(s)`);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;