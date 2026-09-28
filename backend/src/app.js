import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import refreshRoutes from './routes/refresh.routes.js';
import courseRoutes from './routes/course.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import todoRoutes from './routes/todo.routes.js';
import motivationRoutes from './routes/motivation.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

const corsOrigin = process.env.CLIENT_URL || true;
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Resources and Schedule API is running',
  });
});

app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', refreshRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/todos', todoRoutes);
app.use('/api/v1/motivation', motivationRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
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
