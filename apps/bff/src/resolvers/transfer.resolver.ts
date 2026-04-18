import { GraphQLError } from 'graphql';
import type { AppContext } from '../types/index.js';

function makeRef(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export const transferResolvers = {
  Mutation: {
    async transfer(
      _: unknown,
      {
        fromAccountId,
        toAccountId,
        amount,
        description = 'Transfer',
      }: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        description?: string;
      },
      { dataSources }: AppContext
    ) {
      const { accountsAPI, transactionsAPI } = dataSources;

      if (fromAccountId === toAccountId) {
        throw new GraphQLError('Cannot transfer to the same account', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (amount <= 0) {
        throw new GraphQLError('Transfer amount must be greater than zero', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const [fromAccount, toAccount] = await Promise.all([
        accountsAPI.getAccountById(fromAccountId),
        accountsAPI.getAccountById(toAccountId),
      ]);

      if (!fromAccount) throw new GraphQLError('Source account not found', { extensions: { code: 'NOT_FOUND' } });
      if (!toAccount) throw new GraphQLError('Destination account not found', { extensions: { code: 'NOT_FOUND' } });
      if (fromAccount.status !== 'ACTIVE') throw new GraphQLError('Source account is not active', { extensions: { code: 'BAD_USER_INPUT' } });
      if (toAccount.status !== 'ACTIVE') throw new GraphQLError('Destination account is not active', { extensions: { code: 'BAD_USER_INPUT' } });
      if (fromAccount.balance < amount) throw new GraphQLError('Insufficient funds', { extensions: { code: 'INSUFFICIENT_FUNDS' } });

      // Update balances
      const [updatedFrom, updatedTo] = await Promise.all([
        accountsAPI.updateBalance(fromAccountId, fromAccount.balance - amount),
        accountsAPI.updateBalance(toAccountId, toAccount.balance + amount),
      ]);

      // Create transaction records — if this fails, roll back both balances
      const ref = makeRef();
      try {
        const [debitTransaction, creditTransaction] = await Promise.all([
          transactionsAPI.createTransaction({
            accountId: fromAccountId,
            type: 'DEBIT',
            amount,
            description,
            category: 'TRANSFER',
            reference: `${ref}-D`,
          }),
          transactionsAPI.createTransaction({
            accountId: toAccountId,
            type: 'CREDIT',
            amount,
            description,
            category: 'TRANSFER',
            reference: `${ref}-C`,
          }),
        ]);

        return { fromAccount: updatedFrom, toAccount: updatedTo, debitTransaction, creditTransaction };
      } catch (txErr) {
        // Best-effort rollback — restore original balances
        await Promise.allSettled([
          accountsAPI.updateBalance(fromAccountId, fromAccount.balance),
          accountsAPI.updateBalance(toAccountId, toAccount.balance),
        ]);
        throw txErr;
      }
    },
  },
};
