import express from 'express';
import { loansRouter } from './routes/loans.routes.js';

const app = express();
const PORT = process.env.PORT ?? 3003;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'loans-service' });
});

app.use('/loans', loansRouter);

app.listen(PORT, () => {
  console.log(`loans-service running on port ${PORT}`);
});

export { app };
