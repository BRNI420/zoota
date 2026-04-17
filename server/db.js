const { Pool } = require('pg');

// Remove channel_binding from connection string if present
const connStr = (process.env.POSTGRES_URL || '')
  .replace('&channel_binding=require', '')
  .replace('?channel_binding=require&', '?');

// Vercel serverless: keep pool small to avoid connection exhaustion
const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

// Track initialization (persists across requests on same instance)
let _initDone = false;
let _initPromise = null;

// Convert SQLite ? placeholders to PostgreSQL $1, $2, $3...
const toPostgres = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

// Ensure DB is initialized before any query
const ensureInit = async () => {
  if (_initDone) return;
  if (!_initPromise) _initPromise = initDB();
  await _initPromise;
};

// Helper: run a statement (INSERT, UPDATE, DELETE)
const run = async (sql, params = []) => {
  await ensureInit();
  const { rowCount, rows } = await pool.query(toPostgres(sql), params);
  return { lastID: rows[0]?.id, changes: rowCount };
};

// Helper: get one row
const get = async (sql, params = []) => {
  await ensureInit();
  const { rows } = await pool.query(toPostgres(sql), params);
  return rows[0];
};

// Helper: get all rows
const all = async (sql, params = []) => {
  await ensureInit();
  const { rows } = await pool.query(toPostgres(sql), params);
  return rows;
};

// Helper: run raw SQL
const exec = async (sql) => {
  await pool.query(sql);
};

// Initialize tables
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questionnaires (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      height REAL NOT NULL,
      weight REAL NOT NULL,
      activity_level TEXT NOT NULL,
      dietary_preferences TEXT NOT NULL DEFAULT 'none',
      allergies TEXT NOT NULL DEFAULT '[]',
      favorite_foods TEXT NOT NULL DEFAULT '[]',
      foods_to_avoid TEXT NOT NULL DEFAULT '[]',
      training_days_per_week INTEGER NOT NULL DEFAULT 3,
      experience_level TEXT NOT NULL DEFAULT 'beginner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      plan_data TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nutrition_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      daily_calories INTEGER NOT NULL,
      protein_g INTEGER NOT NULL,
      carbs_g INTEGER NOT NULL,
      fat_g INTEGER NOT NULL,
      meals TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      filename TEXT NOT NULL,
      duration TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      exercise_name TEXT NOT NULL,
      instructions TEXT,
      muscle_groups TEXT NOT NULL DEFAULT '[]',
      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      meal_reminders INTEGER NOT NULL DEFAULT 1,
      workout_reminders INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Seed demo accounts if not exists
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  // Seed demo client account
  const demoExists = await pool.query("SELECT id FROM users WHERE email = 'demo@zoota.com'");
  if (demoExists.rows.length === 0) {
    const demoId = uuidv4();
    const demoHash = await bcrypt.hash('demo123', 12);
    await pool.query(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, 'demo@zoota.com', $2, 'משתמש דמו', 'client')",
      [demoId, demoHash]
    );
    await pool.query("INSERT INTO notification_settings (id, user_id) VALUES ($1, $2)", [uuidv4(), demoId]);
    console.log('Demo account seeded');
  }

  // Admin account — always ensure it exists with the correct password
  const ADMIN_EMAIL = 'admin@zoota.com';
  const ADMIN_PASS  = 'Zoota@Admin#2024';
  const adminHash   = await bcrypt.hash(ADMIN_PASS, 10);
  const adminExists = await pool.query("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
  if (adminExists.rows.length === 0) {
    const adminId = uuidv4();
    await pool.query(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, 'מנהל ZOOTA', 'admin')",
      [adminId, ADMIN_EMAIL, adminHash]
    );
    await pool.query("INSERT INTO notification_settings (id, user_id) VALUES ($1, $2)", [uuidv4(), adminId]);
    console.log('Admin account created');
  } else {
    // Always update password to stay in sync with code
    await pool.query(
      "UPDATE users SET password_hash = $1, role = 'admin' WHERE email = $2",
      [adminHash, ADMIN_EMAIL]
    );
    console.log('Admin password synced');
  }

  _initDone = true;
  console.log('Database initialized');
};

// Start init eagerly
_initPromise = initDB().catch(console.error);

module.exports = { run, get, all, exec, pool };
