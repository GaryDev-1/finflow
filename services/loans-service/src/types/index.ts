export interface Loan {
  id: string;
  userId: string;
  principalAmount: number;    // in cents
  outstandingBalance: number; // in cents
  interestRate: number;       // e.g. 12.5 (percent per annum)
  termMonths: number;
  monthlyInstalment: number;  // in cents
  status: 'PENDING' | 'ACTIVE' | 'SETTLED' | 'DEFAULTED' | 'REJECTED';
  disbursedAt: string | null; // ISO 8601
  nextPaymentDate: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repayment {
  id: string;
  loanId: string;
  dueDate: string;   // ISO 8601
  amount: number;    // in cents
  status: 'UPCOMING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  paidAt: string | null;
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
