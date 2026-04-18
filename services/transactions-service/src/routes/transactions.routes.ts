import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  getTransactionSummary,
} from '../controllers/transactions.controller.js';

export const transactionsRouter = Router();

// NOTE: /summary must be registered before /:id to avoid Express matching
// "summary" as an :id param
transactionsRouter.get('/summary', getTransactionSummary);
transactionsRouter.get('/', getTransactions);
transactionsRouter.get('/:id', getTransactionById);
transactionsRouter.post('/', createTransaction);
