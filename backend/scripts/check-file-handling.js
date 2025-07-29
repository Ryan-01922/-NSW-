const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function analyzeFileHandling() {
    const client = await pool.connect();
    
    try {
        console.log('Analyzing File Handling in Transfer Process');
        console.log('='.repeat(50));
        
        // Check a specific property's files
        const testPropertyId = 'NSW-SYD-2025-001';
        
        // Get original property files
        console.log(`\nChecking property: ${testPropertyId}`);
        
        const propertyResult = await client.query(`
            SELECT folio_number, ipfs_hash, metadata, owner_address
            FROM properties 
            WHERE folio_number = $1
        `, [testPropertyId]);
        
        if (propertyResult.rows.length === 0) {
            console.log('Property not found');
            return;
        }
        
        const property = propertyResult.rows[0];
        console.log('Original Property Files:');
        console.log(`  IPFS Hash: ${property.ipfs_hash}`);
        console.log(`  Owner: ${property.owner_address}`);
        if (property.metadata && property.metadata.documents) {
            console.log('  Documents in metadata:');
            property.metadata.documents.forEach((doc, index) => {
                console.log(`    ${index + 1}. ${doc.type}: ${doc.cid || doc.name}`);
            });
        }
        
        // Check transfer requests for this property
        const transferResult = await client.query(`
            SELECT folio_number, from_address, to_address, ipfs_hash, metadata, status, created_at
            FROM ownership_transfers 
            WHERE folio_number = $1
            ORDER BY created_at DESC
            LIMIT 3
        `, [testPropertyId]);
        
        console.log('\nTransfer Request Files:');
        if (transferResult.rows.length === 0) {
            console.log('  No transfer requests found');
        } else {
            transferResult.rows.forEach((transfer, index) => {
                console.log(`  Transfer ${index + 1}:`);
                console.log(`    From: ${transfer.from_address}`);
                console.log(`    To: ${transfer.to_address}`);
                console.log(`    IPFS: ${transfer.ipfs_hash}`);
                console.log(`    Status: ${transfer.status}`);
                console.log(`    Date: ${transfer.created_at}`);
                
                if (transfer.metadata && transfer.metadata.documents) {
                    console.log('    Transfer documents:');
                    transfer.metadata.documents.forEach((doc, docIndex) => {
                        console.log(`      ${docIndex + 1}. ${doc.type}: ${doc.cid || doc.name}`);
                    });
                }
                console.log('');
            });
        }
        
        // Analysis summary
        console.log('\nFILE HANDLING ANALYSIS:');
        console.log('CURRENT ISSUES:');
        console.log('1. Original property files remain unchanged after transfer');
        console.log('2. No mechanism to merge original + transfer documents');
        console.log('3. New owner cannot access complete file history');
        console.log('4. Original IPFS hash in properties table becomes outdated');
        
        console.log('\nRECOMMENDED SOLUTIONS:');
        console.log('A. FILE REPLACEMENT STRATEGY:');
        console.log('1. Create file history table to track all document versions');
        console.log('2. Update properties.metadata to include transfer documents');
        console.log('3. Maintain original files but add transfer documents');
        console.log('4. Create composite document package for new owner');
        
    } catch (error) {
        console.error('Analysis failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

analyzeFileHandling(); 