import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { buildContext } from './context/index.js';

const app = express();
const PORT = process.env.BFF_PORT ?? 4000;

async function start() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'bff' });
  });

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: buildContext,
    })
  );

  app.listen(PORT, () => {
    console.log(`BFF running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

start().catch((err) => {
  console.error('Failed to start BFF:', err);
  process.exit(1);
});

export { app };
