import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountResolvers } from '../resolvers/account.resolver.js';
import { transactionResolvers } from '../resolvers/transaction.resolver.js';
import { loanResolvers } from '../resolvers/loan.resolver.js';
import { dashboardResolvers } from '../resolvers/dashboard.resolver.js';
import type { AppContext } from '../types/index.js';

// ── Shared mock factory ────────────────────────────────────────────────────────
function makeContext(overrides: Partial<AppContext['dataSources']> = {}): AppContext {
  return {
    user: null,
    dataSources: {
      accountsAPI: {
        getAccounts: vi.fn(),
        getAccountById: vi.fn(),
      } as any,
      transactionsAPI: {
        getTransactions: vi.fn(),
        getTransactionById: vi.fn(),
        getTransactionSummary: vi.fn(),
        getRecentTransactions: vi.fn(),
      } as any,
      loansAPI: {
        getLoans: vi.fn(),
        getLoanById: vi.fn(),
        getLoanRepayments: vi.fn(),
      } as any,
      ...overrides,
    },
  };
}

const stubAccount = {
  id: 'a1', userId: 'user-001', accountNumber: '100001', accountType: 'CHEQUE',
  balance: 150000, currency: 'ZAR', status: 'ACTIVE', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};

const stubTransaction = {
  id: 't1', accountId: 'a1', type: 'CREDIT', amount: 5000, currency: 'ZAR',
  description: 'Salary', category: 'SALARY', reference: 'REF001', status: 'COMPLETED',
  transactionDate: '2025-01-15T00:00:00Z', createdAt: '2025-01-15T00:00:00Z',
};

const stubLoan = {
  id: 'l1', userId: 'user-001', principalAmount: 100000, outstandingBalance: 80000,
  interestRate: 9.5, termMonths: 24, monthlyInstalment: 4600, status: 'ACTIVE',
  disbursedAt: '2025-01-01T00:00:00Z', nextPaymentDate: '2025-02-01T00:00:00Z',
  currency: 'ZAR', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};

const stubSummary = { totalCredits: 10000, totalDebits: 5000, netBalance: 5000, transactionCount: 4 };

// ── Account resolvers ──────────────────────────────────────────────────────────
describe('accountResolvers', () => {
  let ctx: AppContext;

  beforeEach(() => { ctx = makeContext(); });

  it('accounts query returns accounts with pageInfo', async () => {
    vi.mocked(ctx.dataSources.accountsAPI.getAccounts).mockResolvedValue({
      accounts: [stubAccount], total: 1,
    });

    const result = await accountResolvers.Query.accounts({}, { userId: 'user-001' }, ctx);
    expect(result.accounts).toHaveLength(1);
    expect(result.pageInfo.total).toBe(1);
    expect(result.pageInfo.page).toBe(1);
    expect(result.pageInfo.hasNextPage).toBe(false);
  });

  it('account query returns single account', async () => {
    vi.mocked(ctx.dataSources.accountsAPI.getAccountById).mockResolvedValue(stubAccount);

    const result = await accountResolvers.Query.account({}, { id: 'a1' }, ctx);
    expect(result).toEqual(stubAccount);
  });

  it('account query returns null when not found', async () => {
    vi.mocked(ctx.dataSources.accountsAPI.getAccountById).mockResolvedValue(null);

    const result = await accountResolvers.Query.account({}, { id: 'missing' }, ctx);
    expect(result).toBeNull();
  });
});

// ── Transaction resolvers ──────────────────────────────────────────────────────
describe('transactionResolvers', () => {
  let ctx: AppContext;

  beforeEach(() => { ctx = makeContext(); });

  it('transactions query returns transactions with summary and pageInfo', async () => {
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactions).mockResolvedValue({
      transactions: [stubTransaction], total: 1,
    });
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactionSummary).mockResolvedValue(stubSummary);

    const result = await transactionResolvers.Query.transactions({}, { page: 1, limit: 20 }, ctx);
    expect(result.transactions).toHaveLength(1);
    expect(result.summary).toEqual(stubSummary);
    expect(result.pageInfo.total).toBe(1);
  });

  it('transaction query returns single transaction', async () => {
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactionById).mockResolvedValue(stubTransaction);

    const result = await transactionResolvers.Query.transaction({}, { id: 't1' }, ctx);
    expect(result).toEqual(stubTransaction);
  });

  it('transaction query returns null when not found', async () => {
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactionById).mockResolvedValue(null);

    const result = await transactionResolvers.Query.transaction({}, { id: 'missing' }, ctx);
    expect(result).toBeNull();
  });
});

// ── Loan resolvers ─────────────────────────────────────────────────────────────
describe('loanResolvers', () => {
  let ctx: AppContext;

  beforeEach(() => { ctx = makeContext(); });

  it('loans query returns loans with pageInfo', async () => {
    vi.mocked(ctx.dataSources.loansAPI.getLoans).mockResolvedValue({
      loans: [stubLoan], total: 1,
    });

    const result = await loanResolvers.Query.loans({}, { userId: 'user-001' }, ctx);
    expect(result.loans).toHaveLength(1);
    expect(result.pageInfo.total).toBe(1);
  });

  it('loan query returns single loan', async () => {
    vi.mocked(ctx.dataSources.loansAPI.getLoanById).mockResolvedValue(stubLoan);

    const result = await loanResolvers.Query.loan({}, { id: 'l1' }, ctx);
    expect(result).toEqual(stubLoan);
  });

  it('Loan.repayments field resolver fetches repayments for a loan', async () => {
    const repayments = [{ id: 'r1', loanId: 'l1', dueDate: '2025-02-01', amount: 4600, status: 'PAID', paidAt: null }];
    vi.mocked(ctx.dataSources.loansAPI.getLoanRepayments).mockResolvedValue(repayments);

    const result = await loanResolvers.Loan.repayments(stubLoan, {}, ctx);
    expect(result).toEqual(repayments);
    expect(ctx.dataSources.loansAPI.getLoanRepayments).toHaveBeenCalledWith('l1');
  });
});

// ── Dashboard resolver ─────────────────────────────────────────────────────────
describe('dashboardResolvers', () => {
  it('dashboard query fans out to all 3 services and aggregates totals', async () => {
    const ctx = makeContext();
    const account2 = { ...stubAccount, id: 'a2', balance: 50000 };

    vi.mocked(ctx.dataSources.accountsAPI.getAccounts).mockResolvedValue({
      accounts: [stubAccount, account2], total: 2,
    });
    vi.mocked(ctx.dataSources.loansAPI.getLoans).mockResolvedValue({
      loans: [stubLoan], total: 1,
    });
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactions).mockResolvedValue({
      transactions: [stubTransaction], total: 1,
    });

    const result = await dashboardResolvers.Query.dashboard({}, { userId: 'user-001' }, ctx);

    expect(result.totalBalance).toBe(200000); // 150000 + 50000
    expect(result.totalOutstanding).toBe(80000);
    expect(result.activeLoansCount).toBe(1);
    expect(result.recentTransactions).toHaveLength(1);
    expect(result.activeLoans).toHaveLength(1);
  });

  it('dashboard calls all 3 services in parallel', async () => {
    const ctx = makeContext();
    vi.mocked(ctx.dataSources.accountsAPI.getAccounts).mockResolvedValue({ accounts: [], total: 0 });
    vi.mocked(ctx.dataSources.loansAPI.getLoans).mockResolvedValue({ loans: [], total: 0 });
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactions).mockResolvedValue({ transactions: [], total: 0 });

    await dashboardResolvers.Query.dashboard({}, { userId: 'user-001' }, ctx);

    expect(ctx.dataSources.accountsAPI.getAccounts).toHaveBeenCalledWith('user-001');
    expect(ctx.dataSources.loansAPI.getLoans).toHaveBeenCalledWith('user-001', 'ACTIVE');
    expect(ctx.dataSources.transactionsAPI.getTransactions).toHaveBeenCalledWith(undefined, 1, 5);
  });

  it('dashboard returns zero totals when no data', async () => {
    const ctx = makeContext();
    vi.mocked(ctx.dataSources.accountsAPI.getAccounts).mockResolvedValue({ accounts: [], total: 0 });
    vi.mocked(ctx.dataSources.loansAPI.getLoans).mockResolvedValue({ loans: [], total: 0 });
    vi.mocked(ctx.dataSources.transactionsAPI.getTransactions).mockResolvedValue({ transactions: [], total: 0 });

    const result = await dashboardResolvers.Query.dashboard({}, { userId: 'user-001' }, ctx);

    expect(result.totalBalance).toBe(0);
    expect(result.totalOutstanding).toBe(0);
    expect(result.activeLoansCount).toBe(0);
  });
});
