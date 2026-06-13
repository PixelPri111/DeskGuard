const express = require('express');
const router = express.Router();
const { db } = require('../db');

module.exports = (io) => {

  // Get available 2-hour slots for a desk (next 7 days)
  router.get('/slots/:deskNumber', (req, res) => {
    const { deskNumber } = req.params;
    const slots = [];
    const now = new Date();
    
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
        const booked = db.prepare(`
          SELECT COUNT(*) as count FROM bookings
          WHERE desk_number = ? 
          AND booking_start < ?
          AND booking_end > ?
          AND status = 'pending'
        `).get(deskNumber, slotEnd.toISOString(), slotStart.toISOString());

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: booked.count === 0,
        });
      }
    }
    
    res.json(slots);
  });

  // Create booking
  router.post('/create', (req, res) => {
    const { desk_number, student_id, student_name, booking_start, booking_end } = req.body;
    
    try {
      db.prepare(`
        INSERT INTO bookings (desk_number, student_id, student_name, booking_start, booking_end, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(desk_number, student_id, student_name, booking_start, booking_end);

      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: 'Booking failed' });
    }
  });

  // Get my bookings
  router.get('/my-bookings/:studentId', (req, res) => {
    const { studentId } = req.params;
    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE student_id = ?
      ORDER BY booking_start DESC
    `).all(studentId);
    
    res.json(bookings);
  });

  // Cancel booking
  router.post('/cancel', (req, res) => {
    const { booking_id } = req.body;
    db.prepare(`
      UPDATE bookings SET status = 'cancelled'
      WHERE id = ?
    `).run(booking_id);
    
    res.json({ success: true });
  });

  // Get bookings for admin dashboard
  router.get('/all', (req, res) => {
    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE status = 'pending'
      ORDER BY booking_start ASC
    `).all();
    
    res.json(bookings);
  });

  return router;
};
