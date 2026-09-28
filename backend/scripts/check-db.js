#!/usr/bin/env node
/**
 * Simple DB connectivity checker using mysql2/promise.
 * Run from repository root: `node backend/scripts/check-db.js`
 * It reads the same env vars your app uses (AIVEN_CONNECTION or DB_*).
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';

const envPath = path.resolve(process.cwd(), 'backend', '.env');
dotenv.config({ path: envPath });

function buildConfig() {
  if (process.env.AIVEN_CONNECTION) return { uri: process.env.AIVEN_CONNECTION };

  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || process.env.AIVEN_DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.AIVEN_DB_PASSWORD || '',
    database: process.env.DB_NAME || process.env.AIVEN_DB_NAME || 'defaultdb',
    ssl: false,
  };

  const rawCa = (process.env.AIVEN_CA_CERT || process.env.DB_SSL_CA || '').trim();
  if (rawCa) {
    let caPem = rawCa;
    try {
      if (!rawCa.includes('-----BEGIN')) caPem = fs.readFileSync(rawCa, 'utf8');
    } catch (err) {
      // keep raw value
      caPem = rawCa;
    }
    cfg.ssl = { ca: caPem, rejectUnauthorized: true };
  }

  return cfg;
}

async function run() {
  const cfg = buildConfig();

  console.log('DB check config:', process.env.AIVEN_CONNECTION ? '[using AIVEN_CONNECTION]' : cfg);

  try {
    let conn;
    if (cfg.uri) {
      // mysql2 supports uri in createConnection
      conn = await mysql.createConnection(cfg.uri);
    } else {
      conn = await mysql.createConnection(cfg);
    }

    console.log('Connected to DB. Server version:');
    const [rows] = await conn.query('SELECT VERSION() as v');
    console.log(rows[0]);

    const [tables] = await conn.query("SHOW TABLES");
    console.log('Tables count:', Array.isArray(tables) ? tables.length : 0);

    await conn.end();
    console.log('DB check succeeded.');
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:');
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    if (err.errno) console.error('Errno:', err.errno);
    if (err.sql) console.error('SQL:', err.sql);
    console.error('Full error:', err);
    process.exit(2);
  }
}

run();
