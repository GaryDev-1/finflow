import type { AppContext } from '../types/index.js';
import type { Loan } from '../types/index.js';

export const loanResolvers = {
  Query: {
    loans: async (
      _: unknown,
      args: { userId?: string; status?: string },
      { dataSources }: AppContext
    ) => {
      const { loans, total } = await dataSources.loansAPI.getLoans(
        args.userId,
        args.status
      );
      return {
        loans,
        pageInfo: {
          total,
          page: 1,
          hasNextPage: false,
        },
      };
    },

    loan: async (
      _: unknown,
      args: { id: string },
      { dataSources }: AppContext
    ) => {
      return dataSources.loansAPI.getLoanById(args.id);
    },
  },

  Mutation: {
    makeRepayment: async (
      _: unknown,
      { loanId, repaymentId }: { loanId: string; repaymentId: string },
      { dataSources }: AppContext
    ) => {
      return dataSources.loansAPI.payRepayment(loanId, repaymentId);
    },
  },

  // Field resolver — BFF fetches repayment schedule per loan
  Loan: {
    repayments: async (
      parent: Loan,
      _args: unknown,
      { dataSources }: AppContext
    ) => {
      return dataSources.loansAPI.getLoanRepayments(parent.id);
    },
  },
};
