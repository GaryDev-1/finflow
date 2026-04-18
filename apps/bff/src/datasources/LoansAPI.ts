import { GraphQLError } from 'graphql';
import fetch from 'node-fetch';
import type { Loan, Repayment, ServiceResponse } from '../types/index.js';

export class LoansAPI {
  private baseURL: string;

  constructor() {
    if (!process.env.LOANS_SERVICE_URL) {
      throw new Error('LOANS_SERVICE_URL environment variable is required');
    }
    this.baseURL = process.env.LOANS_SERVICE_URL;
  }

  async getLoans(userId?: string, status?: string): Promise<{ loans: Loan[]; total: number }> {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (status) params.set('status', status);

    const res = await fetch(`${this.baseURL}/loans?${params}`);
    if (!res.ok) {
      throw new GraphQLError(`Loans service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'loans' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Loan[]>;
    return { loans: body.data, total: body.meta.total };
  }

  async getLoanById(id: string): Promise<Loan | null> {
    const res = await fetch(`${this.baseURL}/loans/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new GraphQLError(`Loans service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'loans' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Loan>;
    return body.data;
  }

  async getLoanRepayments(loanId: string): Promise<Repayment[]> {
    const res = await fetch(`${this.baseURL}/loans/${loanId}/repayments`);
    if (res.status === 404) return [];
    if (!res.ok) {
      throw new GraphQLError(`Loans service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'loans' },
      });
    }
    const body = (await res.json()) as ServiceResponse<Repayment[]>;
    return body.data;
  }

  async payRepayment(loanId: string, repaymentId: string): Promise<{ repayment: Repayment; loan: Loan }> {
    const res = await fetch(`${this.baseURL}/loans/${loanId}/repayments/${repaymentId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 404) {
      throw new GraphQLError('Repayment not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (res.status === 400) {
      const body = (await res.json()) as { error: { code: string; message: string } };
      throw new GraphQLError(body.error.message, { extensions: { code: body.error.code } });
    }
    if (!res.ok) {
      throw new GraphQLError(`Loans service error: ${res.status}`, {
        extensions: { code: 'SERVICE_ERROR', service: 'loans' },
      });
    }
    const body = (await res.json()) as { data: { repayment: Repayment; loan: Loan } };
    return body.data;
  }
}
