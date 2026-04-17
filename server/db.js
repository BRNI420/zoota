const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'zoota.db');
const db = new sqlite3.Database(DB_PATH);

// Helper: run a statement (INSERT, UPDATE, DELETE, CREATE)
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// Helper: get one row
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// Helper: get all rows
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

// Helper: run multiple statements (exec)
const exec = (sql) => new Promise((resolve, reject) => {
  db.exec(sql, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

// Initialize tables
const initDB = async () => {
  await exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      plan_data TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      meal_reminders INTEGER NOT NULL DEFAULT 1,
      workout_reminders INTEGER NOT NULL DEFAULT 1
    );
  `);
  console.log('Database initialized');
};

initDB().catch(console.error);

module.exports = { run, get, all, exec, db };
