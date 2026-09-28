import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { DataTypes, Sequelize } from 'sequelize';
import resourceVisibilityMigration from '../../migrations/202609280001-add-resource-visibility.js';
import passwordResetMigration from '../../migrations/202609290001-add-password-reset-fields.js';

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
        ssl: (() => {
          // Prefer a CA certificate provided via env var (PEM contents) or a file path
          // Support three ways to provide the CA certificate:
          // 1) File path via DB_SSL_CA (or AIVEN_CA_CERT if it's a path)
          // 2) Full PEM contents in AIVEN_CA_CERT or DB_SSL_CA (single-line or multi-line via secret store)
          // 3) Base64-encoded PEM via AIVEN_CA_CERT_B64
          const rawCa = (process.env.AIVEN_CA_CERT || process.env.DB_SSL_CA || '').trim();
          const rawCaB64 = (process.env.AIVEN_CA_CERT_B64 || '').trim();

          let caPem = '';
          if (rawCaB64) {
            try {
              caPem = Buffer.from(rawCaB64, 'base64').toString('utf8');
            } catch (err) {
              caPem = '';
            }
          }

          if (!caPem && rawCa) {
            try {
              if (!rawCa.includes('-----BEGIN')) {
                // treat as file path
                caPem = fs.readFileSync(rawCa, 'utf8');
              } else {
                caPem = rawCa;
              }
            } catch (err) {
              // If file read fails, fall back to raw value (may still be PEM string)
              caPem = rawCa;
            }
          }

          if (caPem) {
            return {
              require: true,
              rejectUnauthorized: true,
              ca: caPem,
            };
          }

          // No CA provided — preserve previous permissive behavior but keep require true
          return {
            require: true,
            rejectUnauthorized: false,
          };
        })(),
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
      ssl: (() => {
        // mirror CA resolution logic used above (support file path, PEM, or base64)
        const rawCa = (process.env.AIVEN_CA_CERT || process.env.DB_SSL_CA || '').trim();
        const rawCaB64 = (process.env.AIVEN_CA_CERT_B64 || '').trim();

        let caPem = '';
        if (rawCaB64) {
          try {
            caPem = Buffer.from(rawCaB64, 'base64').toString('utf8');
          } catch (err) {
            caPem = '';
          }
        }

        if (!caPem && rawCa) {
          try {
            if (!rawCa.includes('-----BEGIN')) {
              caPem = fs.readFileSync(rawCa, 'utf8');
            } else {
              caPem = rawCa;
            }
          } catch (err) {
            caPem = rawCa;
          }
        }

        if (caPem) {
          return {
            require: true,
            rejectUnauthorized: true,
            ca: caPem,
          };
        }

        return process.env.AIVEN_CONNECTION && process.env.AIVEN_CONNECTION.includes('://')
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false;
      })(),
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

    // This additive, idempotent migration keeps existing resources private and
    // makes the visibility column ready before production API requests arrive.
    await resourceVisibilityMigration.up(sequelize.getQueryInterface(), DataTypes);
    await passwordResetMigration.up(sequelize.getQueryInterface(), DataTypes);

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};
