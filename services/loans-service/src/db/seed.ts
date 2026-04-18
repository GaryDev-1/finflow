import { pool } from './client.js';

function monthsFromNow(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const loans = [
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    userId: 'user-001',
    principalAmount: 5000000,      // R 50,000
    outstandingBalance: 3200000,   // R 32,000 remaining
    interestRate: 12.5,
    termMonths: 24,
    monthlyInstalment: 237000,     // ~R 2,370/month
    status: 'ACTIVE',
    disbursedAt: daysAgo(180),
    nextPaymentDate: monthsFromNow(1),
    currency: 'ZAR',
  },
  {
    id: 'a0000001-0000-4000-8000-000000000002',
    userId: 'user-001',
    principalAmount: 1500000,      // R 15,000
    outstandingBalance: 0,
    interestRate: 18.0,
    termMonths: 12,
    monthlyInstalment: 137500,
    status: 'SETTLED',
    disbursedAt: daysAgo(400),
    nextPaymentDate: null,
    currency: 'ZAR',
  },
  {
    id: 'a0000001-0000-4000-8000-000000000003',
    userId: 'user-001',
    principalAmount: 10000000,     // R 100,000
    outstandingBalance: 10000000,
    interestRate: 11.0,
    termMonths: 60,
    monthlyInstalment: 217424,
    status: 'PENDING',
    disbursedAt: null,
    nextPaymentDate: null,
    currency: 'ZAR',
  },
  {
    id: 'a0000001-0000-4000-8000-000000000004',
    userId: 'user-001',
    principalAmount: 2500000,      // R 25,000
    outstandingBalance: 1800000,
    interestRate: 22.0,
    termMonths: 18,
    monthlyInstalment: 159000,
    status: 'DEFAULTED',
    disbursedAt: daysAgo(300),
    nextPaymentDate: null,
    currency: 'ZAR',
  },
];

// Repayments for ACTIVE loan (loan 1) — 24 months total, 6 paid, 18 remaining
function buildRepayments(loanId: string): Array<{
  loanId: string; dueDate: string; amount: number; status: string; paidAt: string | null;
}> {
  const repayments = [];
  for (let i = 0; i < 24; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() - 18 + i + 1);
    const isPast = i < 6;
    const isOverdue = i === 4; // one overdue payment for realism
    repayments.push({
      loanId,
      dueDate: dueDate.toISOString(),
      amount: 237000,
      status: isOverdue ? 'OVERDUE' : isPast ? 'PAID' : 'UPCOMING',
      paidAt: isPast && !isOverdue ? dueDate.toISOString() : null,
    });
  }
  return repayments;
}

async function seed() {
  console.log('Seeding loans...');

  for (const loan of loans) {
    await pool.query(
      `INSERT INTO loans
         (id, user_id, principal_amount, outstanding_balance, interest_rate,
          term_months, monthly_instalment, status, disbursed_at, next_payment_date, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO NOTHING`,
      [
        loan.id, loan.userId, loan.principalAmount, loan.outstandingBalance,
        loan.interestRate, loan.termMonths, loan.monthlyInstalment, loan.status,
        loan.disbursedAt, loan.nextPaymentDate, loan.currency,
      ]
    );
    console.log(`  Inserted loan ${loan.id} [${loan.status}]`);
  }

  // Repayments for the ACTIVE loan only
  const activeLoanId = 'a0000001-0000-4000-8000-000000000001';
  const repayments = buildRepayments(activeLoanId);
  console.log(`\nSeeding ${repayments.length} repayments for active loan...`);

  for (const r of repayments) {
    await pool.query(
      `INSERT INTO repayments (loan_id, due_date, amount, status, paid_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.loanId, r.dueDate, r.amount, r.status, r.paidAt]
    );
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
