import type { Request, Response } from 'express';
import type { AppContext } from '../types/index.js';
import { AccountsAPI } from '../datasources/AccountsAPI.js';
import { TransactionsAPI } from '../datasources/TransactionsAPI.js';
import { LoansAPI } from '../datasources/LoansAPI.js';
import { verifyToken, extractToken } from '../middleware/auth.js';

export async function buildContext({
  req,
}: {
  req: Request;
  res: Response;
}): Promise<AppContext> {
  const token = extractToken(req.headers.authorization);
  const user = token ? await verifyToken(token) : null;

  return {
    dataSources: {
      accountsAPI: new AccountsAPI(),
      transactionsAPI: new TransactionsAPI(),
      loansAPI: new LoansAPI(),
    },
    user,
  };
}
