const { Pool } = require('pg');

// The pool connects on its first query, so the site runs without a database
// while db/queries.js still returns sample data.
module.exports = new Pool({ connectionString: process.env.DATABASE_URL });
