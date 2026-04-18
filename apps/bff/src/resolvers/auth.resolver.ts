import { GraphQLError } from 'graphql';
import { signToken } from '../middleware/auth.js';
import type { AppContext } from '../types/index.js';

const DEMO_USERS: Record<string, { id: string; username: string; password: string }> = {
  demo: { id: 'user-001', username: 'demo', password: 'demo123' },
};

export const authResolvers = {
  Mutation: {
    async login(
      _: unknown,
      { username, password }: { username: string; password: string }
    ) {
      const user = DEMO_USERS[username];
      if (!user || user.password !== password) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }
      const token = await signToken({ sub: user.id, username: user.username });
      return { token, user: { id: user.id, username: user.username } };
    },

    logout(_: unknown, __: unknown, _ctx: AppContext) {
      return true;
    },
  },
};
