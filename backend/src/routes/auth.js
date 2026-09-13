const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

async function logAudit({ schoolId, userId, action, status, ip }) {
  await pool.query(
    `INSERT INTO audit_logs (audit_id, school_id, user_id, action, table_affected, status, ip_address)
     VALUES ($1, $2, $3, $4, 'users', $5, $6)`,
    [crypto.randomUUID(), schoolId, userId, action, status, ip]
  );
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { rows } = await pool.query(
    'SELECT user_id, school_id, password_hash, role FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  if (!user) {
    // No matching user_id to attach to an audit_logs row (FK constraint) — nothing to log.
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  await logAudit({
    schoolId: user.school_id,
    userId: user.user_id,
    action: 'LOGIN',
    status: valid ? 'SUCCESS' : 'FAILURE',
    ip: req.ip,
  });

  if (!valid) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, school_id: user.school_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token });
});

module.exports = router;
