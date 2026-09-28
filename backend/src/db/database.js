import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const buildConnectionConfig = () => {
  const configured = process.env.AIVEN_CONNECTION || process.env.DATABASE_URL;

  if (configured && configured.includes('://')) {
    const url = new URL(configured);

    return {
      dialect: 'mysql',
      host: url.hostname,
      port: Number(url.port || 3306),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\/+/, '') || process.env.DB_NAME || 'defaultdb',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    };
  }

  return {
    dialect: 'mysql',
    host: process.env.AIVEN_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.AIVEN_PORT || process.env.DB_PORT || 3306),
    username: process.env.AIVEN_DB_USER || process.env.DB_USER || 'root',
    password: process.env.AIVEN_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.AIVEN_DB_NAME || process.env.DB_NAME || 'resources_schedule_db',
    logging: false,
    dialectOptions: {
      ssl:
        process.env.AIVEN_CONNECTION && process.env.AIVEN_CONNECTION.includes('://')
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };
};

export const sequelize = new Sequelize(buildConnectionConfig());

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // In development or when explicitly requested, synchronize models
    const shouldSync = process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true';
    if (shouldSync) {
      try {
        await sequelize.sync({ alter: true });
        console.log('Database models synced successfully.');
      } catch (syncError) {
        console.warn('Warning: Database model sync encountered an issue, continuing:', syncError.message);
      }
    }

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};