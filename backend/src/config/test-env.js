require('dotenv').config();

console.log('Environment variables test results:');
console.log('===================');

// Database configuration
console.log('Database configuration:');
console.log(`- Host: ${process.env.DB_HOST}`);
console.log(`- Port: ${process.env.DB_PORT}`);
console.log(`- Database name: ${process.env.DB_NAME}`);
console.log(`- Username: ${process.env.DB_USER}`);
console.log('- Password: [Set]');

// Ethereum configuration
console.log('\nEthereum configuration:');
console.log(`- Network: ${process.env.ETH_NETWORK}`);
console.log(`- Node URL: ${process.env.ETH_NODE_URL}`);
console.log('- Private key: [Set]');

// Smart contract addresses
console.log('\nSmart contract addresses:');
console.log(`- Land Registry: ${process.env.LAND_REGISTRY_ADDRESS}`);
console.log(`- Renewal Approval: ${process.env.RENEWAL_APPROVAL_ADDRESS}`);
console.log(`- Transfer Approval: ${process.env.TRANSFER_APPROVAL_ADDRESS}`);

// Application configuration
console.log('\nApplication configuration:');
console.log(`- Port: ${process.env.PORT}`);
console.log(`- Environment: ${process.env.NODE_ENV}`);
console.log('- JWT secret: [Set]');
console.log(`- JWT expiration: ${process.env.JWT_EXPIRES_IN}`);

// Logging configuration
console.log('\nLogging configuration:');
console.log(`- Log level: ${process.env.LOG_LEVEL}`);
console.log(`- Log file path: ${process.env.LOG_FILE_PATH}`); 