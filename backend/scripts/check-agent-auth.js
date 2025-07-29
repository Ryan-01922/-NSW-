const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkAgentAuth() {
    try {
        console.log('Checking Agent Authorization...\n');

        // Check global agents
        console.log('1. Global Agents:');
        const globalAgents = await pool.query(`
            SELECT 
                agent_address,
                authorized_by,
                authorized_at,
                is_active,
                metadata
            FROM global_agents 
            WHERE is_active = true
            ORDER BY authorized_at DESC
        `);

        if (globalAgents.rows.length === 0) {
            console.log('   No global agents found');
        } else {
            globalAgents.rows.forEach(agent => {
                console.log(`   - Agent: ${agent.agent_address}`);
                console.log(`   - Authorized by: ${agent.authorized_by}`);
                console.log(`   - Authorized at: ${agent.authorized_at}`);
                console.log(`   - Status: ${agent.is_active ? 'Active' : 'Inactive'}`);
                if (agent.metadata) {
                    console.log(`   - Metadata: ${JSON.stringify(agent.metadata)}`);
                }
                console.log('');
            });
        }

        // Check property-specific authorizations
        console.log('2. Property Agent Authorizations:');
        const propertyAgents = await pool.query(`
            SELECT 
                folio_number,
                agent_address,
                owner_address,
                authorized_by,
                authorized_at,
                is_active,
                metadata
            FROM agent_authorization 
            WHERE is_active = true
            ORDER BY authorized_at DESC
        `);

        if (propertyAgents.rows.length === 0) {
            console.log('   No property agent authorizations found');
        } else {
            propertyAgents.rows.forEach(auth => {
                console.log(`   - Property: ${auth.folio_number}`);
                console.log(`   - Agent: ${auth.agent_address}`);
                console.log(`   - Owner: ${auth.owner_address}`);
                console.log(`   - Authorized by: ${auth.authorized_by}`);
                console.log(`   - Authorized at: ${auth.authorized_at}`);
                console.log(`   - Status: ${auth.is_active ? 'Active' : 'Inactive'}`);
                if (auth.metadata) {
                    console.log(`   - Metadata: ${JSON.stringify(auth.metadata)}`);
                }
                console.log('');
            });
        }

        console.log('Agent authorization check completed!');
    } catch (error) {
        console.error('Agent authorization check failed:', error);
    } finally {
        await pool.end();
    }
}

checkAgentAuth(); 