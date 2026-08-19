import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Resources and Schedule API is running',
  });
});

app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err);

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors || [],
  });
});

export default app;
