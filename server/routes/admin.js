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

  return router;
};
