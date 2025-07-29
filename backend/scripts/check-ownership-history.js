const { Pool } = require('pg');
const { ethers } = require('ethers');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkOwnershipHistory() {
    const client = await pool.connect();
    
    try {
        // Property to check
        const propertyId = 'NSW-SYD-2025-001';
        console.log(`Checking ownership history for property: ${propertyId}`);
        console.log('='.repeat(60));
        
        // Get current property details
        const propertyResult = await client.query(`
            SELECT * FROM properties WHERE folio_number = $1
        `, [propertyId]);
        
        if (propertyResult.rows.length > 0) {
            const property = propertyResult.rows[0];
            console.log('Current Property Details:');
            console.log(`  Folio Number: ${property.folio_number}`);
            console.log(`  Current Owner: ${property.owner_address}`);
            console.log(`  Status: ${property.status}`);
            console.log(`  Location: ${property.location || 'Not specified'}`);
            console.log(`  Area: ${property.area_size || 'Not specified'}`);
            console.log(`  Created: ${property.created_at}`);
            console.log(`  Updated: ${property.updated_at}`);
        } else {
            console.log('Property not found on blockchain or error occurred');
        }
        
        // Get ownership transfer history
        console.log('\nOwnership Transfer History:');
        const transferHistory = await client.query(`
            SELECT 
                from_address,
                to_address,
                status,
                created_at,
                metadata
            FROM ownership_transfers 
            WHERE folio_number = $1 
            ORDER BY created_at ASC
        `, [propertyId]);
        
        if (transferHistory.rows.length === 0) {
            console.log('  No transfer history found');
        } else {
            transferHistory.rows.forEach((transfer, index) => {
                console.log(`  Transfer ${index + 1}:`);
                console.log(`    From: ${transfer.from_address}`);
                console.log(`    To: ${transfer.to_address}`);
                console.log(`    Status: ${transfer.status}`);
                console.log(`    Date: ${transfer.created_at}`);
                if (transfer.metadata && transfer.metadata.executedBy) {
                    console.log(`    Executed by: ${transfer.metadata.executedBy}`);
                }
                console.log('');
            });
        }
        
        // Check for blockchain discrepancies
        try {
            // Note: This would require actual blockchain connection
            console.log('Blockchain verification would require live connection');
        } catch (blockchainError) {
            console.log('Error getting ownership history:');
            console.log(`  ${blockchainError.message}`);
        }
        
        // Check pending transfers
        const pendingResult = await client.query(`
            SELECT * FROM ownership_transfers 
            WHERE folio_number = $1 AND status = 'pending'
        `, [propertyId]);
        
        if (pendingResult.rows.length > 0) {
            console.log('Pending Transfer:');
            const pending = pendingResult.rows[0];
            console.log(`  From: ${pending.from_address}`);
            console.log(`  To: ${pending.to_address}`);
            console.log(`  Requested: ${pending.created_at}`);
        } else {
            console.log('No pending transfers');
        }
        
    } catch (error) {
        console.error('Error checking pending transfers:');
        console.error(`  ${error.message}`);
    } finally {
        client.release();
        await pool.end();
        console.log('Ownership history check completed!');
    }
}

checkOwnershipHistory(); 