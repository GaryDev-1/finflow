import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

vi.mock('../db/client.js', () => {
  const mockQuery = vi.fn();
  return { pool: { query: mockQuery } };
});

import { pool } from '../db/client.js';
const mockQuery = pool.query as ReturnType<typeof vi.fn>;

const mockLoan = {
  id: 'a0000001-0000-4000-8000-000000000001',
  user_id: 'user-001',
  principal_amount: 5000000,
  outstanding_balance: 3200000,
  interest_rate: '12.50',
  term_months: 24,
  monthly_instalment: 237000,
  status: 'ACTIVE',
  disbursed_at: new Date('2025-10-01T00:00:00Z'),
  next_payment_date: new Date('2026-05-01T00:00:00Z'),
  currency: 'ZAR',
  created_at: new Date('2025-10-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

const mockRepayment = {
  id: 'a0000002-0000-4000-8000-000000000001',
  loan_id: 'a0000001-0000-4000-8000-000000000001',
  due_date: new Date('2026-05-01T00:00:00Z'),
  amount: 237000,
  status: 'UPCOMING',
  paid_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /health ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'loans-service' });
  });
});

// ── GET /loans ───────────────────────────────────────────────────────────────

describe('GET /loans', () => {
  it('returns all loans', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockLoan], rowCount: 1 });

    const res = await request(app).get('/loans');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('ACTIVE');
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by userId', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockLoan], rowCount: 1 });

    const res = await request(app).get('/loans?userId=user-001');

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('user_id'),
      expect.arrayContaining(['user-001'])
    );
  });

  it('filters by status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockLoan], rowCount: 1 });

    const res = await request(app).get('/loans?status=ACTIVE');

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('status'),
      expect.arrayContaining(['ACTIVE'])
    );
  });
});

// ── GET /loans/:id ───────────────────────────────────────────────────────────

describe('GET /loans/:id', () => {
  it('returns a single loan', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockLoan] });

    const res = await request(app).get('/loans/a0000001-0000-4000-8000-000000000001');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('a0000001-0000-4000-8000-000000000001');
    expect(res.body.data.interestRate).toBe(12.5);
  });

  it('returns 404 when loan does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/loans/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ── POST /loans ──────────────────────────────────────────────────────────────

describe('POST /loans', () => {
  it('creates a loan and returns 201', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockLoan] });

    const res = await request(app)
      .post('/loans')
      .send({
        userId: 'user-001',
        principalAmount: 5000000,
        outstandingBalance: 5000000,
        interestRate: 12.5,
        termMonths: 24,
        monthlyInstalment: 237000,
        currency: 'ZAR',
        disbursedAt: null,
        nextPaymentDate: null,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.principalAmount).toBe(5000000);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/loans')
      .send({ userId: 'user-001' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── PATCH /loans/:id/status ──────────────────────────────────────────────────

describe('PATCH /loans/:id/status', () => {
  it('updates loan status', async () => {
    const updated = { ...mockLoan, status: 'SETTLED' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/loans/a0000001-0000-4000-8000-000000000001/status')
      .send({ status: 'SETTLED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SETTLED');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .patch('/loans/a0000001-0000-4000-8000-000000000001/status')
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when loan does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/loans/nonexistent/status')
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ── GET /loans/:id/repayments ────────────────────────────────────────────────

describe('GET /loans/:id/repayments', () => {
  it('returns repayment schedule for a loan', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'a0000001-0000-4000-8000-000000000001' }] }) // loan exists check
      .mockResolvedValueOnce({ rows: [mockRepayment], rowCount: 1 });

    const res = await request(app).get('/loans/a0000001-0000-4000-8000-000000000001/repayments');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('UPCOMING');
    expect(res.body.data[0].amount).toBe(237000);
  });

  it('returns 404 when loan does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/loans/nonexistent/repayments');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
