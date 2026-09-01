import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://settleup-eta.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    message: 'SettleUp API is running'
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

app.use(errorHandler);

export default app;
