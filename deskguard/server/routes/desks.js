const express = require('express');
const router = express.Router();
const { pool } = require('../db');

async function emitUpdate(io) {
  const { rows } = await pool.query('SELECT * FROM desks');
  io.emit('desks_updated', rows);
}

module.exports = (io) => {

  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM desks');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/checkin', async (req, res) => {
    const { desk_number, student_name, student_id } = req.body;
    const now = new Date().toISOString();
    try {
      await pool.query(`
        UPDATE desks SET
          status = 'occupied',
          student_name = $1,
          student_id = $2,
          checked_in_at = $3,
          last_ping_at = $4,
          away_since = NULL
        WHERE desk_number = $5 AND status = 'free'
      `, [student_name, student_id, now, now, desk_number]);
      await emitUpdate(io);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/away', async (req, res) => {
    const { desk_number } = req.body;
    const now = new Date().toISOString();
    try {
      await pool.query(`
        UPDATE desks SET status = 'away', away_since = $1
        WHERE desk_number = $2
      `, [now, desk_number]);
      await emitUpdate(io);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/back', async (req, res) => {
    const { desk_number } = req.body;
    const now = new Date().toISOString();
    try {
      await pool.query(`
        UPDATE desks SET status = 'occupied',
        away_since = NULL, last_ping_at = $1
        WHERE desk_number = $2
      `, [now, desk_number]);
      await emitUpdate(io);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/release', async (req, res) => {
    const { desk_number } = req.body;
    try {
      await pool.query(`
        UPDATE desks SET status = 'free',
        student_name = NULL, student_id = NULL,
        checked_in_at = NULL, away_since = NULL, last_ping_at = NULL
        WHERE desk_number = $1
      `, [desk_number]);
      await emitUpdate(io);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/ping', async (req, res) => {
    const { desk_number } = req.body;
    const now = new Date().toISOString();
    try {
      await pool.query(`
        UPDATE desks SET status = 'occupied', last_ping_at = $1
        WHERE desk_number = $2
      `, [now, desk_number]);
      await emitUpdate(io);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
