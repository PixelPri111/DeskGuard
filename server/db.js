const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'deskguard.sqlite'));

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS desks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      desk_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'free',
      student_name TEXT,
      student_id TEXT,
      checked_in_at DATETIME,
      away_since DATETIME,
      last_ping_at DATETIME
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM desks').get();
  if (count.count === 0) {
    const rows = ['A','B','C','D'];
    const insert = db.prepare(`
      INSERT INTO desks (desk_number, status)
      VALUES (?, 'free')
    `);
    rows.forEach(row => {
      for (let i = 1; i <= 5; i++) {
        insert.run(`${row}${i}`);
      }
    });
    console.log('✅ Seeded 20 desks');
  }
}

module.exports = { db, initDB };
