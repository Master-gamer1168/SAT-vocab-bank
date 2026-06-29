require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        word TEXT UNIQUE NOT NULL,
        definition TEXT NOT NULL,
        part_of_speech TEXT,
        example_sentence TEXT,
        difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        is_custom BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        word_id INTEGER UNIQUE REFERENCES words(id) ON DELETE CASCADE,
        times_seen INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        times_incorrect INTEGER DEFAULT 0,
        mastered BOOLEAN DEFAULT false,
        skipped BOOLEAN DEFAULT false,
        last_seen TIMESTAMP,
        next_review TIMESTAMP,
        interval_days FLOAT DEFAULT 1,
        ease_factor FLOAT DEFAULT 2.5,
        streak INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id SERIAL PRIMARY KEY,
        mode TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        words_studied INTEGER[]
      );
    `);
    console.log('Migration complete: tables created.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
