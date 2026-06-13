const express = require('express');
const router = express.Router();
const { pool } = require('../db');

module.exports = (io) => {

  router.post('/reset', async (req, res) => {
    const { desk_number } = req.body;
    try {
      await pool.query(`
        UPDATE desks SET status = 'free',
        student_name = NULL, student_id = NULL,
        checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
        WHERE desk_number = $1
      `, [desk_number]);
      const { rows } = await pool.query('SELECT * FROM desks');
      io.emit('desks_updated', rows);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/analytics', async (req, res) => {
    try {
      const { rows: sessions } = await pool.query('SELECT check_in_time FROM sessions');
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
