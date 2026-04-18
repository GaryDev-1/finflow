import { Router } from 'express';
import {
  getLoans,
  getLoanById,
  createLoan,
  updateLoanStatus,
  getLoanRepayments,
  payRepayment,
} from '../controllers/loans.controller.js';

export const loansRouter = Router();

loansRouter.get('/', getLoans);
loansRouter.get('/:id', getLoanById);
loansRouter.post('/', createLoan);
loansRouter.patch('/:id/status', updateLoanStatus);
loansRouter.get('/:id/repayments', getLoanRepayments);
loansRouter.patch('/:id/repayments/:repaymentId/pay', payRepayment);
