// Test script to verify the environment variable loading
require('dotenv').config();
process.env.DRY_RUN = 'true';
process.env.USE_MOCK_DATA = 'true';

const { DRY_RUN, USE_MOCK_DATA } = require('./dist/config');

console.log('Environment variables:');
console.log(`DRY_RUN in .env: ${process.env.DRY_RUN}`);
console.log(`USE_MOCK_DATA in .env: ${process.env.USE_MOCK_DATA}`);
console.log('\nConfig values:');
console.log(`DRY_RUN from config: ${DRY_RUN}`);
console.log(`USE_MOCK_DATA from config: ${USE_MOCK_DATA}`); 