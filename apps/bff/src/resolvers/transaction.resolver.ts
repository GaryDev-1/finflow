import type { AppContext } from '../types/index.js';

export const transactionResolvers = {
  Query: {
    transactions: async (
      _: unknown,
      args: { accountId?: string; page?: number; limit?: number },
      { dataSources }: AppContext
    ) => {
      const page = args.page ?? 1;
      const limit = args.limit ?? 20;

      const [{ transactions, total }, summary] = await Promise.all([
        dataSources.transactionsAPI.getTransactions(args.accountId, page, limit),
        dataSources.transactionsAPI.getTransactionSummary(args.accountId),
      ]);

      return {
        transactions,
        pageInfo: {
          total,
          page,
          hasNextPage: page * limit < total,
        },
        summary,
      };
    },

    transaction: async (
      _: unknown,
      args: { id: string },
      { dataSources }: AppContext
    ) => {
      return dataSources.transactionsAPI.getTransactionById(args.id);
    },
  },
};
