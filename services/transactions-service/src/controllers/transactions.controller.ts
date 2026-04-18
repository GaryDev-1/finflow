import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/client.js';
import type { Transaction, TransactionSummary, ApiResponse } from '../types/index.js';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const CreateTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['CREDIT', 'DEBIT']),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default('ZAR'),
  description: z.string().min(1),
  category: z.enum(['SALARY', 'TRANSFER', 'PAYMENT', 'WITHDRAWAL', 'DEPOSIT', 'FEE']),
  reference: z.string().min(1),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']).default('COMPLETED'),
  transactionDate: z.string().datetime(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    type: row.type as Transaction['type'],
    amount: row.amount as number,
    currency: row.currency as string,
    description: row.description as string,
    category: row.category as Transaction['category'],
    reference: row.reference as string,
    status: row.status as Transaction['status'],
    transactionDate: (row.transaction_date as Date).toISOString(),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

// ── Controllers ──────────────────────────────────────────────────────────────

export async function getTransactions(req: Request, res: Response): Promise<void> {
  const { accountId } = req.query;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const offset = (page - 1) * limit;

  let countQuery: string;
  let dataQuery: string;
  let params: unknown[];

  if (accountId) {
    countQuery = 'SELECT COUNT(*) FROM transactions WHERE account_id = $1';
    dataQuery =
      'SELECT * FROM transactions WHERE account_id = $1 ORDER BY transaction_date DESC LIMIT $2 OFFSET $3';
    params = [accountId, limit, offset];
  } else {
    countQuery = 'SELECT COUNT(*) FROM transactions';
    dataQuery =
      'SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT $1 OFFSET $2';
    params = [limit, offset];
  }

  const [countResult, dataResult] = await Promise.all([
    pool.query(accountId ? countQuery : countQuery, accountId ? [accountId] : []),
    pool.query(dataQuery, params),
  ]);

  const total = parseInt(countResult.rows[0].count as string, 10);

  const response: ApiResponse<Transaction[]> = {
    data: dataResult.rows.map(mapRow),
    meta: { total, page },
  };

  res.json(response);
}

export async function getTransactionById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);

  if (rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Transaction ${id} not found` } });
    return;
  }

  const response: ApiResponse<Transaction> = {
    data: mapRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.json(response);
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  const parsed = CreateTransactionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    return;
  }

  const { accountId, type, amount, currency, description, category, reference, status, transactionDate } =
    parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO transactions
       (account_id, type, amount, currency, description, category, reference, status, transaction_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [accountId, type, amount, currency, description, category, reference, status, transactionDate]
  );

  const response: ApiResponse<Transaction> = {
    data: mapRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.status(201).json(response);
}

export async function getTransactionSummary(req: Request, res: Response): Promise<void> {
  const { accountId } = req.query;

  const whereClause = accountId ? 'WHERE account_id = $1 AND status = $2' : 'WHERE status = $1';
  const params = accountId ? [accountId, 'COMPLETED'] : ['COMPLETED'];

  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) AS total_credits,
       COALESCE(SUM(CASE WHEN type = 'DEBIT'  THEN amount ELSE 0 END), 0) AS total_debits,
       COUNT(*) AS transaction_count
     FROM transactions
     ${whereClause}`,
    params
  );

  const row = rows[0];
  const totalCredits = parseInt(row.total_credits as string, 10);
  const totalDebits = parseInt(row.total_debits as string, 10);

  const summary: TransactionSummary = {
    totalCredits,
    totalDebits,
    netBalance: totalCredits - totalDebits,
    transactionCount: parseInt(row.transaction_count as string, 10),
  };

  const response: ApiResponse<TransactionSummary> = {
    data: summary,
    meta: { total: 1, page: 1 },
  };

  res.json(response);
}
