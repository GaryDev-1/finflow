import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphQLError } from 'graphql';
import { AccountsAPI } from '../datasources/AccountsAPI.js';
import { TransactionsAPI } from '../datasources/TransactionsAPI.js';
import { LoansAPI } from '../datasources/LoansAPI.js';

// ── Mock node-fetch ────────────────────────────────────────────────────────────
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));
import fetch from 'node-fetch';
const mockFetch = vi.mocked(fetch);

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Internal Server Error',
    json: async () => body,
  } as any;
}

beforeEach(() => {
  process.env.ACCOUNTS_SERVICE_URL = 'http://localhost:3001';
  process.env.TRANSACTIONS_SERVICE_URL = 'http://localhost:3002';
  process.env.LOANS_SERVICE_URL = 'http://localhost:3003';
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── AccountsAPI ────────────────────────────────────────────────────────────────
describe('AccountsAPI', () => {
  it('getAccounts returns accounts and total', async () => {
    const accounts = [{ id: 'a1', balance: 10000 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: accounts, meta: { total: 1, page: 1 } }));

    const api = new AccountsAPI();
    const result = await api.getAccounts('user-001');
    expect(result.accounts).toEqual(accounts);
    expect(result.total).toBe(1);
  });

  it('getAccounts throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new AccountsAPI();
    await expect(api.getAccounts()).rejects.toThrow(GraphQLError);
  });

  it('getAccountById returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 404));

    const api = new AccountsAPI();
    const result = await api.getAccountById('missing-id');
    expect(result).toBeNull();
  });

  it('getAccountById returns account on success', async () => {
    const account = { id: 'a1', balance: 10000 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: account, meta: { total: 1, page: 1 } }));

    const api = new AccountsAPI();
    const result = await api.getAccountById('a1');
    expect(result).toEqual(account);
  });

  it('getAccountById throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new AccountsAPI();
    await expect(api.getAccountById('a1')).rejects.toThrow(GraphQLError);
  });

  it('throws if ACCOUNTS_SERVICE_URL is missing', () => {
    delete process.env.ACCOUNTS_SERVICE_URL;
    expect(() => new AccountsAPI()).toThrow('ACCOUNTS_SERVICE_URL');
  });
});

// ── TransactionsAPI ────────────────────────────────────────────────────────────
describe('TransactionsAPI', () => {
  it('getTransactions returns transactions and total', async () => {
    const transactions = [{ id: 't1', amount: 500 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: transactions, meta: { total: 1, page: 1 } }));

    const api = new TransactionsAPI();
    const result = await api.getTransactions();
    expect(result.transactions).toEqual(transactions);
    expect(result.total).toBe(1);
  });

  it('getTransactions throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new TransactionsAPI();
    await expect(api.getTransactions()).rejects.toThrow(GraphQLError);
  });

  it('getTransactionById returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 404));

    const api = new TransactionsAPI();
    const result = await api.getTransactionById('missing');
    expect(result).toBeNull();
  });

  it('getTransactionById throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new TransactionsAPI();
    await expect(api.getTransactionById('t1')).rejects.toThrow(GraphQLError);
  });

  it('getTransactionSummary returns summary', async () => {
    const summary = { totalCredits: 1000, totalDebits: 500, netBalance: 500, transactionCount: 2 };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: summary, meta: { total: 1, page: 1 } }));

    const api = new TransactionsAPI();
    const result = await api.getTransactionSummary();
    expect(result).toEqual(summary);
  });

  it('getTransactionSummary throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new TransactionsAPI();
    await expect(api.getTransactionSummary()).rejects.toThrow(GraphQLError);
  });

  it('throws if TRANSACTIONS_SERVICE_URL is missing', () => {
    delete process.env.TRANSACTIONS_SERVICE_URL;
    expect(() => new TransactionsAPI()).toThrow('TRANSACTIONS_SERVICE_URL');
  });
});

// ── LoansAPI ───────────────────────────────────────────────────────────────────
describe('LoansAPI', () => {
  it('getLoans returns loans and total', async () => {
    const loans = [{ id: 'l1', outstandingBalance: 50000 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: loans, meta: { total: 1, page: 1 } }));

    const api = new LoansAPI();
    const result = await api.getLoans('user-001');
    expect(result.loans).toEqual(loans);
    expect(result.total).toBe(1);
  });

  it('getLoans throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new LoansAPI();
    await expect(api.getLoans()).rejects.toThrow(GraphQLError);
  });

  it('getLoanById returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 404));

    const api = new LoansAPI();
    const result = await api.getLoanById('missing');
    expect(result).toBeNull();
  });

  it('getLoanById throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new LoansAPI();
    await expect(api.getLoanById('l1')).rejects.toThrow(GraphQLError);
  });

  it('getLoanRepayments returns empty array on 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 404));

    const api = new LoansAPI();
    const result = await api.getLoanRepayments('missing');
    expect(result).toEqual([]);
  });

  it('getLoanRepayments returns repayments on success', async () => {
    const repayments = [{ id: 'r1', amount: 1500 }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: repayments, meta: { total: 1, page: 1 } }));

    const api = new LoansAPI();
    const result = await api.getLoanRepayments('l1');
    expect(result).toEqual(repayments);
  });

  it('getLoanRepayments throws GraphQLError on 500', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 500));

    const api = new LoansAPI();
    await expect(api.getLoanRepayments('l1')).rejects.toThrow(GraphQLError);
  });

  it('throws if LOANS_SERVICE_URL is missing', () => {
    delete process.env.LOANS_SERVICE_URL;
    expect(() => new LoansAPI()).toThrow('LOANS_SERVICE_URL');
  });
});
