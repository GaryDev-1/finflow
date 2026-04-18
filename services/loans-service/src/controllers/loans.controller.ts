import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/client.js';
import type { Loan, Repayment, ApiResponse } from '../types/index.js';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const CreateLoanSchema = z.object({
  userId: z.string().min(1),
  principalAmount: z.number().int().positive(),
  outstandingBalance: z.number().int().min(0),
  interestRate: z.number().positive(),
  termMonths: z.number().int().positive(),
  monthlyInstalment: z.number().int().positive(),
  currency: z.string().length(3).default('ZAR'),
  disbursedAt: z.string().datetime().nullable().default(null),
  nextPaymentDate: z.string().datetime().nullable().default(null),
});

const UpdateLoanStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SETTLED', 'DEFAULTED', 'REJECTED']),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapLoanRow(row: Record<string, unknown>): Loan {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    principalAmount: row.principal_amount as number,
    outstandingBalance: row.outstanding_balance as number,
    interestRate: parseFloat(row.interest_rate as string),
    termMonths: row.term_months as number,
    monthlyInstalment: row.monthly_instalment as number,
    status: row.status as Loan['status'],
    disbursedAt: row.disbursed_at ? (row.disbursed_at as Date).toISOString() : null,
    nextPaymentDate: row.next_payment_date ? (row.next_payment_date as Date).toISOString() : null,
    currency: row.currency as string,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

function mapRepaymentRow(row: Record<string, unknown>): Repayment {
  return {
    id: row.id as string,
    loanId: row.loan_id as string,
    dueDate: (row.due_date as Date).toISOString(),
    amount: row.amount as number,
    status: row.status as Repayment['status'],
    paidAt: row.paid_at ? (row.paid_at as Date).toISOString() : null,
  };
}

// ── Controllers ──────────────────────────────────────────────────────────────

export async function getLoans(req: Request, res: Response): Promise<void> {
  const { userId, status } = req.query;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows, rowCount } = await pool.query(
    `SELECT * FROM loans ${whereClause} ORDER BY created_at DESC`,
    params
  );

  const response: ApiResponse<Loan[]> = {
    data: rows.map(mapLoanRow),
    meta: { total: rowCount ?? 0, page: 1 },
  };

  res.json(response);
}

export async function getLoanById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM loans WHERE id = $1', [id]);

  if (rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Loan ${id} not found` } });
    return;
  }

  const response: ApiResponse<Loan> = {
    data: mapLoanRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.json(response);
}

export async function createLoan(req: Request, res: Response): Promise<void> {
  const parsed = CreateLoanSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    return;
  }

  const {
    userId, principalAmount, outstandingBalance, interestRate,
    termMonths, monthlyInstalment, currency, disbursedAt, nextPaymentDate,
  } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO loans
       (user_id, principal_amount, outstanding_balance, interest_rate,
        term_months, monthly_instalment, currency, disbursed_at, next_payment_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, principalAmount, outstandingBalance, interestRate,
     termMonths, monthlyInstalment, currency, disbursedAt, nextPaymentDate]
  );

  const response: ApiResponse<Loan> = {
    data: mapLoanRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.status(201).json(response);
}

export async function updateLoanStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = UpdateLoanStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    return;
  }

  const { rows } = await pool.query(
    `UPDATE loans SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [parsed.data.status, id]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Loan ${id} not found` } });
    return;
  }

  const response: ApiResponse<Loan> = {
    data: mapLoanRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.json(response);
}

export async function payRepayment(req: Request, res: Response): Promise<void> {
  const { id, repaymentId } = req.params;

  const repaymentCheck = await pool.query(
    'SELECT * FROM repayments WHERE id = $1 AND loan_id = $2',
    [repaymentId, id]
  );
  if (repaymentCheck.rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Repayment ${repaymentId} not found` } });
    return;
  }

  const repayment = repaymentCheck.rows[0];
  if (repayment.status === 'PAID') {
    res.status(400).json({ error: { code: 'ALREADY_PAID', message: 'Repayment already paid' } });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: repaymentRows } = await client.query(
      `UPDATE repayments SET status = 'PAID', paid_at = NOW() WHERE id = $1 RETURNING *`,
      [repaymentId]
    );

    const { rows: loanRows } = await client.query(
      `UPDATE loans
         SET outstanding_balance = GREATEST(0, outstanding_balance - $1),
             status = CASE WHEN outstanding_balance - $1 <= 0 THEN 'SETTLED' ELSE status END,
             updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [repayment.amount, id]
    );

    await client.query('COMMIT');

    res.json({
      data: {
        repayment: mapRepaymentRow(repaymentRows[0]),
        loan: mapLoanRow(loanRows[0]),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getLoanRepayments(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Confirm loan exists first
  const loanCheck = await pool.query('SELECT id FROM loans WHERE id = $1', [id]);
  if (loanCheck.rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Loan ${id} not found` } });
    return;
  }

  const { rows, rowCount } = await pool.query(
    'SELECT * FROM repayments WHERE loan_id = $1 ORDER BY due_date ASC',
    [id]
  );

  const response: ApiResponse<Repayment[]> = {
    data: rows.map(mapRepaymentRow),
    meta: { total: rowCount ?? 0, page: 1 },
  };

  res.json(response);
}
