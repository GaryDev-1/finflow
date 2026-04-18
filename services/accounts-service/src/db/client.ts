import pg from 'pg';

const { Pool } = pg;

if (!process.env.ACCOUNTS_DATABASE_URL) {
  throw new Error('ACCOUNTS_DATABASE_URL environment variable is required');
}

export const pool = new Pool({
  connectionString: process.env.ACCOUNTS_DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error', err);
});
