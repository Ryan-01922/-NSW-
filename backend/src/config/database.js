const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool using environment variables
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Test the connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Database connected successfully!');
    
    // Set client_encoding to UTF8
    client.query('SET client_encoding = \'UTF8\'', (err) => {
        done();
        if (err) {
            console.error('Error setting client encoding:', err);
            return;
        }
        console.log('Session charset set successfully!');
    });
});

module.exports = {
    pool
}; 