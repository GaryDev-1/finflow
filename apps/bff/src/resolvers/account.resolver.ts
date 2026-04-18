import type { AppContext } from '../types/index.js';
import type { Account } from '../types/index.js';

export const accountResolvers = {
  Query: {
    accounts: async (
      _: unknown,
      args: { userId?: string; page?: number; limit?: number },
      { dataSources }: AppContext
    ) => {
      const { accounts, total } = await dataSources.accountsAPI.getAccounts(
        args.userId,
        args.page ?? 1,
        args.limit ?? 20
      );
      const page = args.page ?? 1;
      const limit = args.limit ?? 20;
      return {
        accounts,
        pageInfo: {
          total,
          page,
          hasNextPage: page * limit < total,
        },
      };
    },

    account: async (
      _: unknown,
      args: { id: string },
      { dataSources }: AppContext
    ) => {
      return dataSources.accountsAPI.getAccountById(args.id);
    },
  },

  // Field resolver — BFF-level join: fetch recent transactions for each account
  Account: {
    recentTransactions: async (
      parent: Account,
      _args: unknown,
      { dataSources }: AppContext
    ) => {
      const { transactions } = await dataSources.transactionsAPI.getTransactions(
        parent.id,
        1,
        5
      );
      return transactions;
    },
  },
};
