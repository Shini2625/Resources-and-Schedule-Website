import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './db/index.js';
import './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load env from backend/.env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 5000);

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Is another instance running?`);
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    // force exit after timeout
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

// Try to connect to the DB. If it fails, exit (don't start server) unless
// explicitly allowed via FORCE_OFFLINE=true for local development.
connectDB()
  .then(() => {
    console.log('Database connected successfully.');
    startServer();
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error.message || error);

    const allowOffline = String(process.env.FORCE_OFFLINE).toLowerCase() === 'true';
    if (allowOffline && process.env.NODE_ENV === 'development') {
      console.warn('FORCE_OFFLINE=true and NODE_ENV=development — starting in offline/degraded mode.');
      startServer();
      return;
    }

    console.error('Exiting process. Fix the database connection and restart the service.');
    process.exit(1);
  });
