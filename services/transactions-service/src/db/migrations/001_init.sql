CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  type VARCHAR(6) NOT NULL CHECK (type IN ('CREDIT','DEBIT')),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('SALARY','TRANSFER','PAYMENT','WITHDRAWAL','DEPOSIT','FEE')),
  reference VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','COMPLETED','FAILED','REVERSED')),
  transaction_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
