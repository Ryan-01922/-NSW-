const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runIPFSMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Starting IPFS constraint migration...');
        
        // Read the SQL migration file
        const migrationPath = path.join(__dirname, 'update-ipfs-constraint.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Executing migration SQL...');
        
        // Execute the migration
        await client.query(migrationSQL);
        
        console.log('IPFS constraint migration completed successfully!');
        console.log('Database now supports both CIDv0 and CIDv1 formats:');
        console.log('- CIDv0: Qm... (46 characters, base58)');
        console.log('- CIDv1: ba... (59 characters, base32)');
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        console.error('Please check:');
        console.error('1. Database connection settings');
        console.error('2. SQL syntax in update-ipfs-constraint.sql');
        console.error('3. Database permissions');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Execute if run directly
if (require.main === module) {
    runIPFSMigration()
        .then(() => {
            console.log('Migration completed! You can now register properties with Pinata IPFS.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runIPFSMigration }; 