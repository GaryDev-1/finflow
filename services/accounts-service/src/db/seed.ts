import { pool } from './client.js';

const accounts = [
  {
    userId: 'user-001',
    accountNumber: 'ACC-00001',
    accountType: 'CHEQUE',
    balance: 1245050,   // R 12,450.50
    currency: 'ZAR',
    status: 'ACTIVE',
  },
  {
    userId: 'user-001',
    accountNumber: 'ACC-00002',
    accountType: 'SAVINGS',
    balance: 5830000,   // R 58,300.00
    currency: 'ZAR',
    status: 'ACTIVE',
  },
  {
    userId: 'user-001',
    accountNumber: 'ACC-00003',
    accountType: 'CREDIT',
    balance: -320075,   // -R 3,200.75 (credit utilised)
    currency: 'ZAR',
    status: 'ACTIVE',
  },
  {
    userId: 'user-002',
    accountNumber: 'ACC-00004',
    accountType: 'CHEQUE',
    balance: 87500,     // R 875.00
    currency: 'ZAR',
    status: 'FROZEN',
  },
  {
    userId: 'user-002',
    accountNumber: 'ACC-00005',
    accountType: 'SAVINGS',
    balance: 0,
    currency: 'ZAR',
    status: 'CLOSED',
  },
  {
    userId: 'user-003',
    accountNumber: 'ACC-00006',
    accountType: 'CHEQUE',
    balance: 9950000,   // R 99,500.00
    currency: 'ZAR',
    status: 'ACTIVE',
  },
];

async function seed() {
  console.log('Seeding accounts...');

  for (const account of accounts) {
    await pool.query(
      `INSERT INTO accounts (user_id, account_number, account_type, balance, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (account_number) DO NOTHING`,
      [
        account.userId,
        account.accountNumber,
        account.accountType,
        account.balance,
        account.currency,
        account.status,
      ]
    );
    console.log(`  Inserted ${account.accountNumber}`);
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
