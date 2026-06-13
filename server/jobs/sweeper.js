const { db } = require('../db');

const DEMO_MODE = true;

const TIMINGS = {
  awayExpiry: DEMO_MODE ? 2 * 60 * 1000 : 20 * 60 * 1000,
  stillHereCheck: DEMO_MODE ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000,
  abandonedCleanup: DEMO_MODE ? 3 * 60 * 1000 : (2 * 60 * 60 + 10 * 60) * 1000,
};

function startSweeper(io) {
  console.log(`🧹 Sweeper started in ${DEMO_MODE ? 'DEMO' : 'PRODUCTION'} mode`);

  setInterval(() => {
    const now = Date.now();
    let changed = false;

    const awayDesks = db.prepare(`
      SELECT * FROM desks WHERE status = 'away'
    `).all();

    awayDesks.forEach(desk => {
      const awaySince = new Date(desk.away_since).getTime();
      if (now - awaySince >= TIMINGS.awayExpiry) {
        db.prepare(`
          UPDATE desks SET status = 'free',
          student_name = NULL, student_id = NULL,
          checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
          WHERE desk_number = ?
        `).run(desk.desk_number);
        console.log(`⏰ Desk ${desk.desk_number} away expired → freed`);
        changed = true;
      }
    });

    const occupiedDesks = db.prepare(`
      SELECT * FROM desks WHERE status = 'occupied'
    `).all();

    occupiedDesks.forEach(desk => {
      const lastPing = new Date(desk.last_ping_at).getTime();
      if (now - lastPing >= TIMINGS.stillHereCheck) {
        db.prepare(`
          UPDATE desks SET status = 'abandoned'
          WHERE desk_number = ?
        `).run(desk.desk_number);
        console.log(`❓ Desk ${desk.desk_number} no ping → abandoned`);
        changed = true;
      }
    });

    const abandonedDesks = db.prepare(`
      SELECT * FROM desks WHERE status = 'abandoned'
    `).all();

    abandonedDesks.forEach(desk => {
      const lastPing = new Date(desk.last_ping_at).getTime();
      if (now - lastPing >= TIMINGS.abandonedCleanup) {
        db.prepare(`
          UPDATE desks SET status = 'free',
          student_name = NULL, student_id = NULL,
          checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
          WHERE desk_number = ?
        `).run(desk.desk_number);
        console.log(`🗑️ Desk ${desk.desk_number} abandoned too long → freed`);
        changed = true;
      }
    });

    if (changed) {
      const allDesks = db.prepare('SELECT * FROM desks').all();
      io.emit('desks_updated', allDesks);
    }

  }, 10000);
}

module.exports = { startSweeper };
