import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/client.js';
import type { Account, ApiResponse } from '../types/index.js';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const CreateAccountSchema = z.object({
  userId: z.string().min(1),
  accountNumber: z.string().min(1),
  accountType: z.enum(['CHEQUE', 'SAVINGS', 'CREDIT']),
  balance: z.number().int().min(0).default(0),
  currency: z.string().length(3).default('ZAR'),
  status: z.enum(['ACTIVE', 'FROZEN', 'CLOSED']).default('ACTIVE'),
});

const UpdateBalanceSchema = z.object({
  balance: z.number().int(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountNumber: row.account_number as string,
    accountType: row.account_type as Account['accountType'],
    balance: row.balance as number,
    currency: row.currency as string,
    status: row.status as Account['status'],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

// ── Controllers ──────────────────────────────────────────────────────────────

export async function getAccounts(req: Request, res: Response): Promise<void> {
  const { userId } = req.query;

  const { rows, rowCount } = userId
    ? await pool.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    : await pool.query('SELECT * FROM accounts ORDER BY created_at DESC');

  const response: ApiResponse<Account[]> = {
    data: rows.map(mapRow),
    meta: { total: rowCount ?? 0, page: 1 },
  };

  res.json(response);
}

export async function getAccountById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);

  if (rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Account ${id} not found` } });
    return;
  }

  const response: ApiResponse<Account> = {
    data: mapRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.json(response);
}

export async function createAccount(req: Request, res: Response): Promise<void> {
  const parsed = CreateAccountSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    return;
  }

  const { userId, accountNumber, accountType, balance, currency, status } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO accounts (user_id, account_number, account_type, balance, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, accountNumber, accountType, balance, currency, status]
  );

  const response: ApiResponse<Account> = {
    data: mapRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.status(201).json(response);
}

export async function updateBalance(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = UpdateBalanceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    return;
  }

  const { rows } = await pool.query(
    `UPDATE accounts SET balance = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [parsed.data.balance, id]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Account ${id} not found` } });
    return;
  }

  const response: ApiResponse<Account> = {
    data: mapRow(rows[0]),
    meta: { total: 1, page: 1 },
  };

  res.json(response);
}
