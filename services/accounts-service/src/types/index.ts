export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'CHEQUE' | 'SAVINGS' | 'CREDIT';
  balance: number;       // stored in cents
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;     // ISO 8601
  updatedAt: string;
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
