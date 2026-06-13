const express = require('express');
const router = express.Router();
const { db } = require('../db');

module.exports = (io) => {

  router.post('/reset', (req, res) => {
    const { desk_number } = req.body;
    db.prepare(`
      UPDATE desks SET status = 'free',
      student_name = NULL, student_id = NULL,
      checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
      WHERE desk_number = ?
    `).run(desk_number);
    const allDesks = db.prepare('SELECT * FROM desks').all();
    io.emit('desks_updated', allDesks);
    res.json({ success: true });
  });

  router.get('/analytics', (req, res) => {
    try {
      const sessions = db.prepare('SELECT check_in_time FROM sessions').all();
      const hourlyData = Array(24).fill(0);
      
      sessions.forEach(session => {
        if (session.check_in_time) {
          const hour = new Date(session.check_in_time).getHours();
          if (hour >= 0 && hour < 24) {
            hourlyData[hour]++;
          }
        }
      });

      let peakHourIndex = 0;
      let peakCount = 0;
      for (let i = 0; i < 24; i++) {
        if (hourlyData[i] > peakCount) {
          peakCount = hourlyData[i];
          peakHourIndex = i;
        }
      }

      const pad = (num) => String(num).padStart(2, '0');
      const peakHour = `${pad(peakHourIndex)}:00 - ${pad(peakHourIndex + 1)}:00`;

      res.json({
        peakHour,
        peakCount,
        hourlyData
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
