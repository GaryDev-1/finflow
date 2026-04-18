import pg from 'pg';

const { Pool } = pg;

if (!process.env.LOANS_DATABASE_URL) {
  throw new Error('LOANS_DATABASE_URL environment variable is required');
}

export const pool = new Pool({
  connectionString: process.env.LOANS_DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err);
});
