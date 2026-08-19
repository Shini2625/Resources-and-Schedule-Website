import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const buildFallbackConnectionUrl = () => {
  const username = process.env.AIVEN_DB_USER || process.env.DB_USER || 'root';
  const password = process.env.AIVEN_DB_PASSWORD || process.env.DB_PASSWORD || '';
  const host = process.env.AIVEN_HOST || process.env.DB_HOST || '127.0.0.1';
  const port = process.env.AIVEN_PORT || process.env.DB_PORT || 3306;
  const database = process.env.AIVEN_DB_NAME || process.env.DB_NAME || 'resources_schedule_db';

  return `mysql://${username}:${password}@${host}:${port}/${database}`;
};

const connectionString = (() => {
  const configured = process.env.AIVEN_CONNECTION || process.env.DATABASE_URL;

  if (configured && configured.includes('://')) {
    return configured;
  }

  return buildFallbackConnectionUrl();
})();

export const sequelize = new Sequelize(connectionString, {
  dialect: 'mysql',
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
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synced successfully.');

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};