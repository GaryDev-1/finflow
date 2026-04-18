export interface Transaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;        // in cents
  currency: string;
  description: string;
  category: 'SALARY' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'FEE';
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  transactionDate: string; // ISO 8601
  createdAt: string;
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  transactionCount: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
