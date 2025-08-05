const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load test environment configuration
dotenv.config({ path: '.env.test' });

// Configure test database connection
const testPool = new Pool({
  user: process.env.DB_TEST_USER,
  host: process.env.DB_TEST_HOST,
  database: process.env.DB_TEST_NAME,
  password: process.env.DB_TEST_PASSWORD,
  port: process.env.DB_TEST_PORT,
});

// Global setup for tests
beforeAll(async () => {
  // Reset test database before running tests
  await testPool.query('BEGIN');
  await testPool.query('DELETE FROM users');
  await testPool.query('DELETE FROM patients');
  await testPool.query('DELETE FROM physicians');
  await testPool.query('DELETE FROM questionnaires');
  await testPool.query('COMMIT');
});

// Cleanup after tests
afterAll(async () => {
  await testPool.end();
});

// Export test utilities
module.exports = {
  testPool,
};