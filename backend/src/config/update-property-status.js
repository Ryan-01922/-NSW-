const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updatePropertyStatus() {
    const client = await pool.connect();
    
    try {
        console.log('Checking current property status...');
        
        // Check current pending properties
        const pendingResult = await client.query(`
            SELECT folio_number, status, created_at 
            FROM properties 
            WHERE status = 'pending'
            ORDER BY created_at DESC
        `);
        
        console.log(`Found ${pendingResult.rows.length} pending properties:`);
        pendingResult.rows.forEach(property => {
            console.log(`  - ${property.folio_number}: ${property.status} (created: ${property.created_at})`);
        });
        
        if (pendingResult.rows.length === 0) {
            console.log('No pending properties found. All properties are already active.');
            return;
        }
        
        console.log('\nUpdating pending properties to active status...');
        
        // Update all pending properties to active
        const updateResult = await client.query(`
            UPDATE properties 
            SET status = 'active', updated_at = CURRENT_TIMESTAMP 
            WHERE status = 'pending'
            RETURNING folio_number, status
        `);
        
        console.log(`Successfully updated ${updateResult.rows.length} properties to active status:`);
        updateResult.rows.forEach(property => {
            console.log(`  - ${property.folio_number}: ${property.status}`);
        });
        
        console.log('\nProperty status update completed!');
        
    } catch (error) {
        console.error('Error updating property status:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updatePropertyStatus(); 