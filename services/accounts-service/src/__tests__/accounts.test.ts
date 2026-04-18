import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

// Mock the pg pool so tests don't need a real database
vi.mock('../db/client.js', () => {
  const mockQuery = vi.fn();
  return { pool: { query: mockQuery } };
});

import { pool } from '../db/client.js';
const mockQuery = pool.query as ReturnType<typeof vi.fn>;

const mockAccount = {
  id: 'acc-uuid-001',
  user_id: 'user-001',
  account_number: 'ACC-00001',
  account_type: 'CHEQUE',
  balance: 1245050,
  currency: 'ZAR',
  status: 'ACTIVE',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /health ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'accounts-service' });
  });
});

// ── GET /accounts ────────────────────────────────────────────────────────────

describe('GET /accounts', () => {
  it('returns all accounts', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAccount], rowCount: 1 });

    const res = await request(app).get('/accounts');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].accountNumber).toBe('ACC-00001');
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by userId when ?userId= is provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAccount], rowCount: 1 });

    const res = await request(app).get('/accounts?userId=user-001');

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE user_id'),
      ['user-001']
    );
  });
});

// ── GET /accounts/:id ────────────────────────────────────────────────────────

describe('GET /accounts/:id', () => {
  it('returns a single account', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAccount] });

    const res = await request(app).get('/accounts/acc-uuid-001');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('acc-uuid-001');
  });

  it('returns 404 when account does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/accounts/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ── POST /accounts ───────────────────────────────────────────────────────────

describe('POST /accounts', () => {
  it('creates a new account and returns 201', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockAccount] });

    const res = await request(app)
      .post('/accounts')
      .send({
        userId: 'user-001',
        accountNumber: 'ACC-00001',
        accountType: 'CHEQUE',
        balance: 1245050,
        currency: 'ZAR',
        status: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.accountType).toBe('CHEQUE');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/accounts')
      .send({ accountType: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── PATCH /accounts/:id/balance ──────────────────────────────────────────────

describe('PATCH /accounts/:id/balance', () => {
  it('updates the balance and returns the account', async () => {
    const updated = { ...mockAccount, balance: 9999999 };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/accounts/acc-uuid-001/balance')
      .send({ balance: 9999999 });

    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe(9999999);
  });

  it('returns 404 when account does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/accounts/nonexistent/balance')
      .send({ balance: 100 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for non-integer balance', async () => {
    const res = await request(app)
      .patch('/accounts/acc-uuid-001/balance')
      .send({ balance: 'not-a-number' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
