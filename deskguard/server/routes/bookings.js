const express = require('express');
const router = express.Router();
const { pool } = require('../db');

module.exports = (io) => {

  // Get available 2-hour slots for a desk (next 7 days)
  router.get('/slots/:deskNumber', async (req, res) => {
    const { deskNumber } = req.params;
    const slots = [];
    const now = new Date();

    try {
      // Generate 2-hour slots for next 7 days
      for (let day = 0; day < 7; day++) {
        for (let hour = 8; hour < 20; hour += 2) {
          const slotStart = new Date(now);
          slotStart.setDate(slotStart.getDate() + day);
          slotStart.setHours(hour, 0, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setHours(hour + 2);

          // Skip if slot is in the past
          if (slotEnd < now) continue;

          // Check if slot is booked
          const { rows } = await pool.query(`
            SELECT COUNT(*) as count FROM bookings
            WHERE desk_number = $1
            AND booking_start < $2
            AND booking_end > $3
            AND status = 'pending'
          `, [deskNumber, slotEnd.toISOString(), slotStart.toISOString()]);

          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: parseInt(rows[0].count, 10) === 0,
          });
        }
      }

      res.json(slots);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create booking
  router.post('/create', async (req, res) => {
    const { desk_number, student_id, student_name, booking_start, booking_end } = req.body;

    try {
      await pool.query(`
        INSERT INTO bookings (desk_number, student_id, student_name, booking_start, booking_end, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
      `, [desk_number, student_id, student_name, booking_start, booking_end]);

      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: 'Booking failed' });
    }
  });

  // Get my bookings
  router.get('/my-bookings/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
      const { rows } = await pool.query(`
        SELECT * FROM bookings
        WHERE student_id = $1
        ORDER BY booking_start DESC
      `, [studentId]);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Cancel booking
  router.post('/cancel', async (req, res) => {
    const { booking_id } = req.body;
    try {
      await pool.query(`
        UPDATE bookings SET status = 'cancelled'
        WHERE id = $1
      `, [booking_id]);

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get bookings for admin dashboard
  router.get('/all', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM bookings
        WHERE status = 'pending'
        ORDER BY booking_start ASC
      `);

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
