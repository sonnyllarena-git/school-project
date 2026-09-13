const { Pool } = require('pg');

// NEVER log student names, IDs, grades, or other PII query results/params.
// Only log counts, table names, or non-identifying metadata.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
