import express from 'express';
import { transactionsRouter } from './routes/transactions.routes.js';

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'transactions-service' });
});

app.use('/transactions', transactionsRouter);

app.listen(PORT, () => {
  console.log(`transactions-service running on port ${PORT}`);
});

export { app };
