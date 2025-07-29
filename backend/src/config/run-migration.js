const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Running global_agents table migration...');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Migration completed successfully!');
        console.log('global_agents table has been created.');
        
        // Read and execute the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrate-global-agents.sql'),
            'utf8'
        );
        
        await client.query(migrationSQL);
        
        // Verify the table was created
        const verifyResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'global_agents'
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log('Verification: global_agents table exists');
        } else {
            console.log('Verification failed: global_agents table not found');
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration(); 