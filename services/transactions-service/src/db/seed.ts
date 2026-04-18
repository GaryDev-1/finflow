import { pool } from './client.js';

// Account IDs match the seeded accounts from accounts-service
const ACCOUNT_IDS = {
  ACC_001_CHEQUE:  'aaaaaaaa-0001-0001-0001-000000000001',
  ACC_001_SAVINGS: 'aaaaaaaa-0001-0001-0001-000000000002',
  ACC_001_CREDIT:  'aaaaaaaa-0001-0001-0001-000000000003',
  ACC_003_CHEQUE:  'aaaaaaaa-0003-0003-0003-000000000006',
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const transactions = [
  // user-001 CHEQUE — salary and everyday spend
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'CREDIT', amount: 3500000, description: 'Monthly salary', category: 'SALARY', reference: 'TXN-20260101-001', status: 'COMPLETED', transactionDate: daysAgo(90) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 120000,  description: 'Electricity bill', category: 'PAYMENT', reference: 'TXN-20260105-002', status: 'COMPLETED', transactionDate: daysAgo(87) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 85000,   description: 'Grocery shopping', category: 'PAYMENT', reference: 'TXN-20260110-003', status: 'COMPLETED', transactionDate: daysAgo(82) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 50000,   description: 'ATM withdrawal', category: 'WITHDRAWAL', reference: 'TXN-20260115-004', status: 'COMPLETED', transactionDate: daysAgo(77) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'CREDIT', amount: 3500000, description: 'Monthly salary', category: 'SALARY', reference: 'TXN-20260201-005', status: 'COMPLETED', transactionDate: daysAgo(60) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 250000,  description: 'Rent payment', category: 'PAYMENT', reference: 'TXN-20260202-006', status: 'COMPLETED', transactionDate: daysAgo(59) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 15000,   description: 'Bank fee', category: 'FEE', reference: 'TXN-20260205-007', status: 'COMPLETED', transactionDate: daysAgo(56) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 65000,   description: 'Petrol', category: 'PAYMENT', reference: 'TXN-20260210-008', status: 'COMPLETED', transactionDate: daysAgo(51) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 30000,   description: 'Streaming subscription', category: 'PAYMENT', reference: 'TXN-20260215-009', status: 'COMPLETED', transactionDate: daysAgo(46) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'CREDIT', amount: 3500000, description: 'Monthly salary', category: 'SALARY', reference: 'TXN-20260301-010', status: 'COMPLETED', transactionDate: daysAgo(30) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 250000,  description: 'Rent payment', category: 'PAYMENT', reference: 'TXN-20260302-011', status: 'COMPLETED', transactionDate: daysAgo(29) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 90000,   description: 'Grocery shopping', category: 'PAYMENT', reference: 'TXN-20260308-012', status: 'COMPLETED', transactionDate: daysAgo(23) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 15000,   description: 'Bank fee', category: 'FEE', reference: 'TXN-20260310-013', status: 'COMPLETED', transactionDate: daysAgo(21) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 45000,   description: 'Restaurant dinner', category: 'PAYMENT', reference: 'TXN-20260312-014', status: 'COMPLETED', transactionDate: daysAgo(19) },
  { accountId: ACCOUNT_IDS.ACC_001_CHEQUE, type: 'DEBIT',  amount: 12000,   description: 'Mobile recharge', category: 'PAYMENT', reference: 'TXN-20260315-015', status: 'COMPLETED', transactionDate: daysAgo(16) },

  // user-001 SAVINGS — deposits and transfers
  { accountId: ACCOUNT_IDS.ACC_001_SAVINGS, type: 'CREDIT', amount: 500000, description: 'Transfer from cheque', category: 'TRANSFER', reference: 'TXN-20260106-016', status: 'COMPLETED', transactionDate: daysAgo(86) },
  { accountId: ACCOUNT_IDS.ACC_001_SAVINGS, type: 'CREDIT', amount: 500000, description: 'Transfer from cheque', category: 'TRANSFER', reference: 'TXN-20260206-017', status: 'COMPLETED', transactionDate: daysAgo(58) },
  { accountId: ACCOUNT_IDS.ACC_001_SAVINGS, type: 'CREDIT', amount: 500000, description: 'Transfer from cheque', category: 'TRANSFER', reference: 'TXN-20260306-018', status: 'COMPLETED', transactionDate: daysAgo(28) },
  { accountId: ACCOUNT_IDS.ACC_001_SAVINGS, type: 'CREDIT', amount: 25000,  description: 'Interest payment', category: 'DEPOSIT', reference: 'TXN-20260228-019', status: 'COMPLETED', transactionDate: daysAgo(43) },
  { accountId: ACCOUNT_IDS.ACC_001_SAVINGS, type: 'DEBIT',  amount: 200000, description: 'Emergency withdrawal', category: 'WITHDRAWAL', reference: 'TXN-20260220-020', status: 'COMPLETED', transactionDate: daysAgo(50) },

  // user-001 CREDIT — purchases and repayments
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'DEBIT',  amount: 180000, description: 'Online shopping', category: 'PAYMENT', reference: 'TXN-20260108-021', status: 'COMPLETED', transactionDate: daysAgo(84) },
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'DEBIT',  amount: 95000,  description: 'Clothing store', category: 'PAYMENT', reference: 'TXN-20260120-022', status: 'COMPLETED', transactionDate: daysAgo(72) },
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'CREDIT', amount: 200000, description: 'Credit card payment', category: 'TRANSFER', reference: 'TXN-20260125-023', status: 'COMPLETED', transactionDate: daysAgo(67) },
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'DEBIT',  amount: 55000,  description: 'Pharmacy', category: 'PAYMENT', reference: 'TXN-20260208-024', status: 'COMPLETED', transactionDate: daysAgo(54) },
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'DEBIT',  amount: 8500,   description: 'Credit facility fee', category: 'FEE', reference: 'TXN-20260228-025', status: 'COMPLETED', transactionDate: daysAgo(43) },
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'DEBIT',  amount: 110000, description: 'Electronics purchase', category: 'PAYMENT', reference: 'TXN-20260305-026', status: 'COMPLETED', transactionDate: daysAgo(26) },
  { accountId: ACCOUNT_IDS.ACC_001_CREDIT, type: 'DEBIT',  amount: 42000,  description: 'Gym membership', category: 'PAYMENT', reference: 'TXN-20260310-027', status: 'PENDING', transactionDate: daysAgo(21) },

  // user-003 CHEQUE
  { accountId: ACCOUNT_IDS.ACC_003_CHEQUE, type: 'CREDIT', amount: 8500000, description: 'Business revenue', category: 'DEPOSIT', reference: 'TXN-20260115-028', status: 'COMPLETED', transactionDate: daysAgo(77) },
  { accountId: ACCOUNT_IDS.ACC_003_CHEQUE, type: 'DEBIT',  amount: 1200000, description: 'Supplier payment', category: 'TRANSFER', reference: 'TXN-20260120-029', status: 'COMPLETED', transactionDate: daysAgo(72) },
  { accountId: ACCOUNT_IDS.ACC_003_CHEQUE, type: 'CREDIT', amount: 4200000, description: 'Business revenue', category: 'DEPOSIT', reference: 'TXN-20260215-030', status: 'COMPLETED', transactionDate: daysAgo(46) },
  { accountId: ACCOUNT_IDS.ACC_003_CHEQUE, type: 'DEBIT',  amount: 950000,  description: 'Office lease', category: 'PAYMENT', reference: 'TXN-20260301-031', status: 'COMPLETED', transactionDate: daysAgo(30) },
  { accountId: ACCOUNT_IDS.ACC_003_CHEQUE, type: 'DEBIT',  amount: 320000,  description: 'Staff salaries', category: 'SALARY', reference: 'TXN-20260305-032', status: 'FAILED', transactionDate: daysAgo(26) },
];

async function seed() {
  console.log('Seeding transactions...');

  for (const tx of transactions) {
    await pool.query(
      `INSERT INTO transactions
         (account_id, type, amount, currency, description, category, reference, status, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (reference) DO NOTHING`,
      [tx.accountId, tx.type, tx.amount, 'ZAR', tx.description, tx.category, tx.reference, tx.status, tx.transactionDate]
    );
    console.log(`  Inserted ${tx.reference}`);
  }

  console.log(`Seed complete. ${transactions.length} transactions inserted.`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
