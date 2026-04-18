import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateBalance,
} from '../controllers/accounts.controller.js';

export const accountsRouter = Router();

accountsRouter.get('/', getAccounts);
accountsRouter.get('/:id', getAccountById);
accountsRouter.post('/', createAccount);
accountsRouter.patch('/:id/balance', updateBalance);
