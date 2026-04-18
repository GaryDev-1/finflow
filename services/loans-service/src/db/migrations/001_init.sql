CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL,
  principal_amount INTEGER NOT NULL,
  outstanding_balance INTEGER NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  term_months INTEGER NOT NULL,
  monthly_instalment INTEGER NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','SETTLED','DEFAULTED','REJECTED')),
  disbursed_at TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','PAID','OVERDUE','PARTIAL')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
