import { GraphQLError } from 'graphql';
import fetch from 'node-fetch';
import type { Account, ServiceResponse } from '../types/index.js';

export class AccountsAPI {
  private baseURL: string;

  constructor() {
    if (!process.env.ACCOUNTS_SERVICE_URL) {
      throw new Error('ACCOUNTS_SERVICE_URL environment variable is required');
    }
    this.baseURL = process.env.ACCOUNTS_SERVICE_URL;
  }

  async getAccounts(userId?: string, page = 1, limit = 20): Promise<{ accounts: Account[]; total: number }> {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    params.set('page', String(page));
    params.set('limit', String(limit));

    const res = await fetch(`${this.baseURL}/accounts?${params}`);
    if (!res.ok) {
      throw new GraphQLError(`Accounts service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'accounts' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Account[]>;
    return { accounts: body.data, total: body.meta.total };
  }

  async getAccountById(id: string): Promise<Account | null> {
    const res = await fetch(`${this.baseURL}/accounts/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new GraphQLError(`Accounts service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'accounts' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Account>;
    return body.data;
  }

  async updateBalance(id: string, balance: number): Promise<Account> {
    const res = await fetch(`${this.baseURL}/accounts/${id}/balance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance }),
    });
    if (!res.ok) {
      throw new GraphQLError(`Accounts service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'accounts' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Account>;
    return body.data;
  }
}
