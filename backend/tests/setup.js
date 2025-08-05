const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create a test database connection pool
const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Global setup for tests
beforeAll(async () => {
  // Perform test database setup
  await testPool.query('BEGIN');
  
  // Optional: Seed test data or reset database state
  await testPool.query(`
    -- Reset sequences and clear tables
    TRUNCATE TABLE physicians, patients, clinical_trials CASCADE;
    
    -- Reset any auto-incrementing sequences
    ALTER SEQUENCE physicians_id_seq RESTART WITH 1;
    ALTER SEQUENCE patients_id_seq RESTART WITH 1;
    ALTER SEQUENCE clinical_trials_id_seq RESTART WITH 1;
  `);
});

afterAll(async () => {
  // Close database connection
  await testPool.end();
});

// Provide global test utilities
global.testPool = testPool;

// Error handler to prevent unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});