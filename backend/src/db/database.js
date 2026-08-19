import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const getDbConnectionUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.AIVEN_HOST || process.env.DB_HOST || '127.0.0.1';
  const port = process.env.AIVEN_PORT || process.env.DB_PORT || 3306;
  const username = process.env.AIVEN_DB_USER || process.env.DB_USER || 'root';
  const password = process.env.AIVEN_DB_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.AIVEN_DB_NAME || process.env.DB_NAME || 'database_development';

  return `mysql://${username}:${password}@${host}:${port}/${database}`;
};

export const sequelize = new Sequelize(getDbConnectionUrl(), {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    ssl:
      process.env.AIVEN_SSL === 'false'
        ? false
        : {
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
});
