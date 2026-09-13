const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT user_id, name, email, role, notify_email, notify_sms FROM users WHERE user_id = $1',
    [req.user.user_id]
  );
  res.json(rows[0]);
});

router.patch('/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'current_password and a new_password (min 8 chars) are required' });
  }
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
  const valid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'current password is incorrect' });

  const newHash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newHash, req.user.user_id]);
  res.json({ updated: true });
});

router.patch('/notifications', async (req, res) => {
  const { notify_email, notify_sms } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET notify_email = COALESCE($1, notify_email), notify_sms = COALESCE($2, notify_sms)
     WHERE user_id = $3 RETURNING notify_email, notify_sms`,
    [notify_email ?? null, notify_sms ?? null, req.user.user_id]
  );
  res.json(rows[0]);
});

module.exports = router;
