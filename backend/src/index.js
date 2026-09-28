import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './db/index.js';
import './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const PORT = Number(process.env.PORT || 5000);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} database connected successfully`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  });
