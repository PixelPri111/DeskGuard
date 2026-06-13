const express = require('express');
const router = express.Router();
const { db } = require('../db');



function emitUpdate(io) {
  const allDesks = db.prepare('SELECT * FROM desks').all();
  io.emit('desks_updated', allDesks);
}

module.exports = (io) => {

  router.get('/', (req, res) => {
    const desks = db.prepare('SELECT * FROM desks').all();
    res.json(desks);
  });

  router.post('/checkin', (req, res) => {
    const { desk_number, student_name, student_id } = req.body;
    const now = new Date().toISOString();
    try {
      db.prepare(`
        UPDATE desks SET
          status = 'occupied',
          student_name = ?,
          student_id = ?,
          checked_in_at = ?,
          last_ping_at = ?,
          away_since = NULL
        WHERE desk_number = ? AND status = 'free'
      `).run(student_name, student_id, now, now, desk_number);
      emitUpdate(io);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/away', (req, res) => {
    const { desk_number } = req.body;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE desks SET status = 'away', away_since = ?
      WHERE desk_number = ?
    `).run(now, desk_number);
    emitUpdate(io);
    res.json({ success: true });
  });

  router.post('/back', (req, res) => {
    const { desk_number } = req.body;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE desks SET status = 'occupied',
      away_since = NULL, last_ping_at = ?
      WHERE desk_number = ?
    `).run(now, desk_number);
    emitUpdate(io);
    res.json({ success: true });
  });

  router.post('/release', (req, res) => {
    const { desk_number } = req.body;
    db.prepare(`
      UPDATE desks SET status = 'free',
      student_name = NULL, student_id = NULL,
      checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
      WHERE desk_number = ?
    `).run(desk_number);
    emitUpdate(io);
    res.json({ success: true });
  });

  router.post('/ping', (req, res) => {
    const { desk_number } = req.body;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE desks SET status = 'occupied', last_ping_at = ?
      WHERE desk_number = ?
    `).run(now, desk_number);
    emitUpdate(io);
    res.json({ success: true });
  });

  return router;
};
