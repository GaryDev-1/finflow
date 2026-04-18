import { accountResolvers } from './account.resolver.js';
import { transactionResolvers } from './transaction.resolver.js';
import { loanResolvers } from './loan.resolver.js';
import { dashboardResolvers } from './dashboard.resolver.js';
import { authResolvers } from './auth.resolver.js';
import { transferResolvers } from './transfer.resolver.js';

// Custom scalar resolvers — pass values through as-is
// (Money = integer cents, DateTime = ISO string)
const scalarResolvers = {
  DateTime: {
    serialize: (value: unknown) => value,
    parseValue: (value: unknown) => value,
    parseLiteral: (ast: { value: unknown }) => ast.value,
  },
  Money: {
    serialize: (value: unknown) => value,
    parseValue: (value: unknown) => value,
    parseLiteral: (ast: { value: unknown }) => ast.value,
  },
};

export const resolvers = {
  ...scalarResolvers,
  Query: {
    ...accountResolvers.Query,
    ...transactionResolvers.Query,
    ...loanResolvers.Query,
    ...dashboardResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...transferResolvers.Mutation,
    ...loanResolvers.Mutation,
  },
  Account: accountResolvers.Account,
  Loan: loanResolvers.Loan,
};
