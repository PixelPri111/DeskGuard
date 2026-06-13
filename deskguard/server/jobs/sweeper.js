const { pool } = require('../db');

const DEMO_MODE = true;

const TIMINGS = {
  awayExpiry: DEMO_MODE ? 2 * 60 * 1000 : 20 * 60 * 1000,
  stillHereCheck: DEMO_MODE ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000,
  abandonedCleanup: DEMO_MODE ? 3 * 60 * 1000 : (2 * 60 * 60 + 10 * 60) * 1000,
  sessionMax: DEMO_MODE ? 3 * 60 * 1000 : 3 * 60 * 60 * 1000,
};

function startSweeper(io) {
  console.log(`🧹 Sweeper started in ${DEMO_MODE ? 'DEMO' : 'PRODUCTION'} mode`);

  setInterval(async () => {
    const now = Date.now();
    let changed = false;

    try {
      // 1. AWAY EXPIRY
      const { rows: awayDesks } = await pool.query(`
        SELECT * FROM desks WHERE status = 'away'
      `);

      for (const desk of awayDesks) {
        const awaySince = new Date(desk.away_since).getTime();
        if (now - awaySince >= TIMINGS.awayExpiry) {
          await pool.query(`
            UPDATE desks SET status = 'free',
            student_name = NULL, student_id = NULL,
            checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
            WHERE desk_number = $1
          `, [desk.desk_number]);
          console.log(`⏰ Desk ${desk.desk_number} away expired → freed`);
          changed = true;
        }
      }

      // 2. STILL HERE CHECK
      const { rows: occupiedDesks } = await pool.query(`
        SELECT * FROM desks WHERE status = 'occupied'
      `);

      for (const desk of occupiedDesks) {
        const lastPing = new Date(desk.last_ping_at).getTime();
        if (now - lastPing >= TIMINGS.stillHereCheck) {
          await pool.query(`
            UPDATE desks SET status = 'abandoned'
            WHERE desk_number = $1
          `, [desk.desk_number]);
          console.log(`❓ Desk ${desk.desk_number} no ping → abandoned`);
          changed = true;
        }
      }

      // 3. ABANDONED CLEANUP
      const { rows: abandonedDesks } = await pool.query(`
        SELECT * FROM desks WHERE status = 'abandoned'
      `);

      for (const desk of abandonedDesks) {
        const lastPing = new Date(desk.last_ping_at).getTime();
        if (now - lastPing >= TIMINGS.abandonedCleanup) {
          await pool.query(`
            UPDATE desks SET status = 'free',
            student_name = NULL, student_id = NULL,
            checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
            WHERE desk_number = $1
          `, [desk.desk_number]);
          console.log(`🗑️ Desk ${desk.desk_number} abandoned too long → freed`);
          changed = true;
        }
      }

      // 4. AUTO CHECK-IN FOR BOOKED SLOTS
      const { rows: bookings } = await pool.query(`
        SELECT * FROM bookings
        WHERE status = 'pending'
        AND booking_start <= NOW()
        AND booking_end > NOW()
      `);

      for (const booking of bookings) {
        const { rows: deskRows } = await pool.query(`
          SELECT * FROM desks WHERE desk_number = $1
        `, [booking.desk_number]);

        const currentDesk = deskRows[0];
        if (currentDesk && currentDesk.status === 'free') {
          await pool.query(`
            UPDATE desks SET
              status = 'occupied',
              student_name = $1,
              student_id = $2,
              checked_in_at = NOW(),
              last_ping_at = NOW()
            WHERE desk_number = $3
          `, [booking.student_name, booking.student_id, booking.desk_number]);

          console.log(`📅 Booking: Student ${booking.student_id} auto checked-in to ${booking.desk_number}`);
          changed = true;
        }
      }

      // 5. AUTO RELEASE EXPIRED BOOKINGS
      const { rows: expiredBookings } = await pool.query(`
        SELECT * FROM bookings
        WHERE status = 'pending'
        AND booking_end < NOW()
      `);

      for (const booking of expiredBookings) {
        await pool.query(`
          UPDATE bookings SET status = 'completed'
          WHERE id = $1
        `, [booking.id]);

        const { rows: deskRows } = await pool.query(`
          SELECT * FROM desks WHERE desk_number = $1
        `, [booking.desk_number]);

        const desk = deskRows[0];
        if (desk && desk.status === 'occupied' && desk.student_id === booking.student_id) {
          await pool.query(`
            UPDATE desks SET status = 'free',
            student_name = NULL, student_id = NULL,
            checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
            WHERE desk_number = $1
          `, [booking.desk_number]);
          console.log(`📅 Booking expired: Desk ${booking.desk_number} released`);
          changed = true;
        }
      }

      if (changed) {
        const { rows: allDesks } = await pool.query('SELECT * FROM desks');
        const { rows: allBookings } = await pool.query(`
          SELECT * FROM bookings WHERE status = 'pending'
        `);
        io.emit('desks_updated', allDesks);
        io.emit('bookings_updated', allBookings);
      }

    } catch (err) {
      console.error('🧹 Sweeper error:', err.message);
    }

  }, 10000);
}

module.exports = { startSweeper };
