import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

vi.mock('../db/client.js', () => {
  const mockQuery = vi.fn();
  return { pool: { query: mockQuery } };
});

import { pool } from '../db/client.js';
const mockQuery = pool.query as ReturnType<typeof vi.fn>;

const mockTx = {
  id: 'tx-uuid-001',
  account_id: 'acc-uuid-001',
  type: 'CREDIT',
  amount: 3500000,
  currency: 'ZAR',
  description: 'Monthly salary',
  category: 'SALARY',
  reference: 'TXN-20260101-001',
  status: 'COMPLETED',
  transaction_date: new Date('2026-01-01T00:00:00Z'),
  created_at: new Date('2026-01-01T00:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /health ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'transactions-service' });
  });
});

// ── GET /transactions ────────────────────────────────────────────────────────

describe('GET /transactions', () => {
  it('returns paginated transactions', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [mockTx] });

    const res = await request(app).get('/transactions');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.meta.page).toBe(1);
  });

  it('filters by accountId when ?accountId= is provided', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [mockTx] });

    const res = await request(app).get('/transactions?accountId=acc-uuid-001');

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE account_id'),
      expect.arrayContaining(['acc-uuid-001'])
    );
  });

  it('respects ?limit= and ?page= params', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '32' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/transactions?limit=10&page=2');

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
  });
});

// ── GET /transactions/summary ────────────────────────────────────────────────

describe('GET /transactions/summary', () => {
  it('returns aggregated totals', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total_credits: '10500000', total_debits: '3200000', transaction_count: '12' }],
    });

    const res = await request(app).get('/transactions/summary');

    expect(res.status).toBe(200);
    expect(res.body.data.totalCredits).toBe(10500000);
    expect(res.body.data.totalDebits).toBe(3200000);
    expect(res.body.data.netBalance).toBe(7300000);
    expect(res.body.data.transactionCount).toBe(12);
  });

  it('filters summary by accountId', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total_credits: '3500000', total_debits: '500000', transaction_count: '5' }],
    });

    const res = await request(app).get('/transactions/summary?accountId=acc-uuid-001');

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('account_id'),
      expect.arrayContaining(['acc-uuid-001'])
    );
  });
});

// ── GET /transactions/:id ────────────────────────────────────────────────────

describe('GET /transactions/:id', () => {
  it('returns a single transaction', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockTx] });

    const res = await request(app).get('/transactions/tx-uuid-001');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('tx-uuid-001');
    expect(res.body.data.type).toBe('CREDIT');
  });

  it('returns 404 when transaction does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/transactions/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ── POST /transactions ───────────────────────────────────────────────────────

describe('POST /transactions', () => {
  it('creates a transaction and returns 201', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockTx] });

    const res = await request(app)
      .post('/transactions')
      .send({
        accountId: 'aaaaaaaa-0001-4001-8001-000000000001',
        type: 'CREDIT',
        amount: 3500000,
        currency: 'ZAR',
        description: 'Monthly salary',
        category: 'SALARY',
        reference: 'TXN-20260101-001',
        status: 'COMPLETED',
        transactionDate: '2026-01-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('SALARY');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ type: 'CREDIT' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid category', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({
        accountId: 'aaaaaaaa-0001-4001-8001-000000000001',
        type: 'CREDIT',
        amount: 100,
        description: 'Test',
        category: 'INVALID_CAT',
        reference: 'TXN-TEST-001',
        transactionDate: '2026-01-01T00:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
