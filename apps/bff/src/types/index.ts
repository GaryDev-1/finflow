import type { JWTPayload } from 'jose';
import type { AccountsAPI } from '../datasources/AccountsAPI.js';
import type { TransactionsAPI } from '../datasources/TransactionsAPI.js';
import type { LoansAPI } from '../datasources/LoansAPI.js';

// ── Apollo Context ────────────────────────────────────────────────────────────

export interface AppContext {
  dataSources: {
    accountsAPI: AccountsAPI;
    transactionsAPI: TransactionsAPI;
    loansAPI: LoansAPI;
  };
  user: JWTPayload | null;
}

// ── Downstream service response shapes ───────────────────────────────────────

export interface ServiceResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
  };
}

// ── Account ───────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'CHEQUE' | 'SAVINGS' | 'CREDIT';
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

// ── Transaction ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  category: 'SALARY' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'FEE';
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  transactionDate: string;
  createdAt: string;
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactionCount: number;
}

// ── Loan ──────────────────────────────────────────────────────────────────────

export interface Loan {
  id: string;
  userId: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  termMonths: number;
  monthlyInstalment: number;
  status: 'PENDING' | 'ACTIVE' | 'SETTLED' | 'DEFAULTED' | 'REJECTED';
  disbursedAt: string | null;
  nextPaymentDate: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repayment {
  id: string;
  loanId: string;
  dueDate: string;
  amount: number;
  status: 'UPCOMING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  paidAt: string | null;
}
