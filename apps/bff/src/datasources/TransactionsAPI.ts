import { GraphQLError } from 'graphql';
import fetch from 'node-fetch';
import type { Transaction, TransactionSummary, ServiceResponse } from '../types/index.js';

export class TransactionsAPI {
  private baseURL: string;

  constructor() {
    if (!process.env.TRANSACTIONS_SERVICE_URL) {
      throw new Error('TRANSACTIONS_SERVICE_URL environment variable is required');
    }
    this.baseURL = process.env.TRANSACTIONS_SERVICE_URL;
  }

  async getTransactions(
    accountId?: string,
    page = 1,
    limit = 20
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    params.set('page', String(page));
    params.set('limit', String(limit));

    const res = await fetch(`${this.baseURL}/transactions?${params}`);
    if (!res.ok) {
      throw new GraphQLError(`Transactions service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'transactions' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Transaction[]>;
    return { transactions: body.data, total: body.meta.total };
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const res = await fetch(`${this.baseURL}/transactions/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new GraphQLError(`Transactions service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'transactions' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Transaction>;
    return body.data;
  }

  async getTransactionSummary(accountId?: string): Promise<TransactionSummary> {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);

    const res = await fetch(`${this.baseURL}/transactions/summary?${params}`);
    if (!res.ok) {
      throw new GraphQLError(`Transactions service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'transactions' },
      });
    }
    const body = (await res.json()) as ServiceResponse<TransactionSummary>;
    return body.data;
  }

  async getRecentTransactions(accountId: string, limit = 5): Promise<Transaction[]> {
    const { transactions } = await this.getTransactions(accountId, 1, limit);
    return transactions;
  }

  async createTransaction(data: {
    accountId: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    description: string;
    category: Transaction['category'];
    reference: string;
    currency?: string;
  }): Promise<Transaction> {
    const res = await fetch(`${this.baseURL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currency: 'ZAR',
        status: 'COMPLETED',
        transactionDate: new Date().toISOString(),
        ...data,
      }),
    });
    if (!res.ok) {
      let detail = `status ${res.status}`;
      try {
        const err = (await res.json()) as { error?: { message?: string } };
        if (err?.error?.message) detail = err.error.message;
      } catch { /* ignore parse error */ }
      throw new GraphQLError(`Transactions service error: ${detail}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'transactions' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Transaction>;
    return body.data;
  }
}
