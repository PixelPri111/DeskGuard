const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  // Create desks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS desks (
      id SERIAL PRIMARY KEY,
      desk_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'free',
      student_name TEXT,
      student_id TEXT,
      checked_in_at TIMESTAMP,
      away_since TIMESTAMP,
      last_ping_at TIMESTAMP
    )
  `);

  // Create bookings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      desk_number TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      booking_start TIMESTAMP NOT NULL,
      booking_end TIMESTAMP NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(desk_number) REFERENCES desks(desk_number)
    )
  `);

  // Create sessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      desk_number TEXT NOT NULL,
      student_name TEXT,
      student_id TEXT,
      check_in_time TIMESTAMP NOT NULL,
      release_time TIMESTAMP,
      last_state_change_time TIMESTAMP,
      current_state TEXT,
      occupied_duration INTEGER DEFAULT 0,
      away_duration INTEGER DEFAULT 0,
      auto_released INTEGER DEFAULT 0,
      abandoned INTEGER DEFAULT 0
    )
  `);

  // Create trigger function for session logging on check-in
  await pool.query(`
    CREATE OR REPLACE FUNCTION fn_start_session_on_checkin()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status = 'occupied' AND OLD.status = 'free' THEN
        INSERT INTO sessions (desk_number, student_name, student_id, check_in_time)
        VALUES (NEW.desk_number, NEW.student_name, NEW.student_id, NEW.checked_in_at);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Drop and recreate trigger to avoid duplicate conflicts
  await pool.query(`DROP TRIGGER IF EXISTS start_session_on_checkin ON desks`);
  await pool.query(`
    CREATE TRIGGER start_session_on_checkin
    AFTER UPDATE OF status ON desks
    FOR EACH ROW
    EXECUTE FUNCTION fn_start_session_on_checkin();
  `);

  // Create trigger function for session logging on release
  await pool.query(`
    CREATE OR REPLACE FUNCTION fn_end_session_on_release()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status = 'free' AND OLD.status != 'free' THEN
        UPDATE sessions
        SET release_time = NOW()
        WHERE id = (
          SELECT id FROM sessions
          WHERE desk_number = OLD.desk_number AND release_time IS NULL
          ORDER BY id DESC
          LIMIT 1
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`DROP TRIGGER IF EXISTS end_session_on_release ON desks`);
  await pool.query(`
    CREATE TRIGGER end_session_on_release
    AFTER UPDATE OF status ON desks
    FOR EACH ROW
    EXECUTE FUNCTION fn_end_session_on_release();
  `);

  // Seed desks if empty
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM desks');
  if (parseInt(rows[0].count, 10) === 0) {
    const deskRows = ['A', 'B', 'C', 'D'];
    for (const row of deskRows) {
      for (let i = 1; i <= 5; i++) {
        await pool.query(
          `INSERT INTO desks (desk_number, status) VALUES ($1, 'free')`,
          [`${row}${i}`]
        );
      }
    }
    console.log('✅ Seeded 20 desks');
  }

  console.log('✅ PostgreSQL database initialized');
}

module.exports = { pool, initDB };
