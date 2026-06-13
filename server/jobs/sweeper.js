const { db } = require('../db');

const DEMO_MODE = true;

const TIMINGS = {
  awayExpiry: DEMO_MODE ? 2 * 60 * 1000 : 20 * 60 * 1000,
  stillHereCheck: DEMO_MODE ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000,
  abandonedCleanup: DEMO_MODE ? 3 * 60 * 1000 : (2 * 60 * 60 + 10 * 60) * 1000,
  sessionMax: DEMO_MODE ? 3 * 60 * 1000 : 3 * 60 * 60 * 1000,
};

function startSweeper(io) {
  console.log(`🧹 Sweeper started in ${DEMO_MODE ? 'DEMO' : 'PRODUCTION'} mode`);

  setInterval(() => {
    const now = Date.now();
    let changed = false;

    // 1. AWAY EXPIRY
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

    // 2. STILL HERE CHECK
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

    // 3. ABANDONED CLEANUP
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

    // 4. AUTO CHECK-IN FOR BOOKED SLOTS
    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE status = 'pending'
      AND booking_start <= datetime('now')
      AND booking_end > datetime('now')
    `).all();

    bookings.forEach(booking => {
      const currentDesk = db.prepare(`
        SELECT * FROM desks WHERE desk_number = ?
      `).get(booking.desk_number);

      // If desk is free, auto check-in
      if (currentDesk.status === 'free') {
        db.prepare(`
          UPDATE desks SET
            status = 'occupied',
            student_name = ?,
            student_id = ?,
            checked_in_at = datetime('now'),
            last_ping_at = datetime('now')
          WHERE desk_number = ?
        `).run(booking.student_name, booking.student_id, booking.desk_number);
        
        console.log(`📅 Booking: Student ${booking.student_id} auto checked-in to ${booking.desk_number}`);
        changed = true;
      }
    });

    // 5. AUTO RELEASE EXPIRED BOOKINGS
    const expiredBookings = db.prepare(`
      SELECT * FROM bookings
      WHERE status = 'pending'
      AND booking_end < datetime('now')
    `).all();

    expiredBookings.forEach(booking => {
      db.prepare(`
        UPDATE bookings SET status = 'completed'
        WHERE id = ?
      `).run(booking.id);

      // Release desk if still booked
      const desk = db.prepare(`
        SELECT * FROM desks WHERE desk_number = ?
      `).get(booking.desk_number);

      if (desk.status === 'occupied' && desk.student_id === booking.student_id) {
        db.prepare(`
          UPDATE desks SET status = 'free',
          student_name = NULL, student_id = NULL,
          checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
          WHERE desk_number = ?
        `).run(booking.desk_number);
        console.log(`📅 Booking expired: Desk ${booking.desk_number} released`);
        changed = true;
      }
    });

    if (changed) {
      const allDesks = db.prepare('SELECT * FROM desks').all();
      const allBookings = db.prepare(`
        SELECT * FROM bookings WHERE status = 'pending'
      `).all();
      io.emit('desks_updated', allDesks);
      io.emit('bookings_updated', allBookings);
    }

  }, 10000);
}

module.exports = { startSweeper };
