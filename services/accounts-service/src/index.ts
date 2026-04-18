import express from 'express';
import { accountsRouter } from './routes/accounts.routes.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'accounts-service' });
});

app.use('/accounts', accountsRouter);

app.listen(PORT, () => {
  console.log(`accounts-service running on port ${PORT}`);
});

export { app };
