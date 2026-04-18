import type { AppContext } from '../types/index.js';

export const dashboardResolvers = {
  Query: {
    dashboard: async (
      _: unknown,
      args: { userId: string },
      { dataSources }: AppContext
    ) => {
      // Fan out to all three services in parallel
      const [{ accounts }, { loans: activeLoans }, { transactions: recentTransactions }] =
        await Promise.all([
          dataSources.accountsAPI.getAccounts(args.userId),
          dataSources.loansAPI.getLoans(args.userId, 'ACTIVE'),
          dataSources.transactionsAPI.getTransactions(undefined, 1, 5),
        ]);

      const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);

      return {
        totalBalance,
        activeLoansCount: activeLoans.length,
        totalOutstanding,
        recentTransactions,
        accounts,
        activeLoans,
      };
    },
  },
};
