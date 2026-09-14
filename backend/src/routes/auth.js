const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { SECURITY_QUESTIONS, REQUIRED_QUESTION_COUNT } = require('../lib/securityQuestions');

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
    'SELECT user_id, school_id, password_hash, role, name, must_complete_setup FROM users WHERE email = $1',
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

  res.json({
    token,
    user: { user_id: user.user_id, role: user.role, name: user.name, must_complete_setup: user.must_complete_setup },
  });
});

// --- Forgot password (no session yet — a user who's locked out by
// definition can't use the authenticated /me/password flow). Three steps,
// each handing the client a short-lived, single-purpose JWT so the server
// stays stateless (no reset-session table) while still ensuring a client
// can't skip straight to "reset" without actually answering the questions.

router.post('/forgot-password/start', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const { rows: userRows } = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  const genericError = { error: 'No security questions are on file for this account. Contact your administrator.' };
  if (!userRows[0]) return res.status(400).json(genericError);

  const { rows: questionRows } = await pool.query(
    'SELECT question FROM security_questions WHERE user_id = $1 ORDER BY question',
    [userRows[0].user_id]
  );
  if (questionRows.length === 0) return res.status(400).json(genericError);

  const challengeToken = jwt.sign(
    { purpose: 'forgot-password', user_id: userRows[0].user_id },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  res.json({ challenge_token: challengeToken, questions: questionRows.map(r => r.question) });
});

router.post('/forgot-password/verify', async (req, res) => {
  const { challenge_token, answers } = req.body;
  if (!challenge_token || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'challenge_token and answers are required' });
  }
  let claims;
  try {
    claims = jwt.verify(challenge_token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'This reset link has expired — start over.' });
  }
  if (claims.purpose !== 'forgot-password') return res.status(401).json({ error: 'invalid token' });

  const { rows } = await pool.query(
    'SELECT question, answer_hash FROM security_questions WHERE user_id = $1',
    [claims.user_id]
  );
  if (rows.length === 0 || rows.length !== answers.length) {
    return res.status(400).json({ error: 'One or more answers are incorrect.' });
  }
  const byQuestion = Object.fromEntries(rows.map(r => [r.question, r.answer_hash]));
  for (const a of answers) {
    const hash = byQuestion[a.question];
    if (!hash) return res.status(400).json({ error: 'One or more answers are incorrect.' });
    const ok = await bcrypt.compare(String(a.answer || '').trim().toLowerCase(), hash);
    if (!ok) return res.status(400).json({ error: 'One or more answers are incorrect.' });
  }

  const resetToken = jwt.sign(
    { purpose: 'password-reset', user_id: claims.user_id },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  res.json({ reset_token: resetToken });
});

router.post('/forgot-password/reset', async (req, res) => {
  const { reset_token, new_password } = req.body;
  if (!reset_token || !new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'reset_token and a new_password (min 8 chars) are required' });
  }
  let claims;
  try {
    claims = jwt.verify(reset_token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'This reset link has expired — start over.' });
  }
  if (claims.purpose !== 'password-reset') return res.status(401).json({ error: 'invalid token' });

  const { rows } = await pool.query('SELECT school_id FROM users WHERE user_id = $1', [claims.user_id]);
  if (!rows[0]) return res.status(404).json({ error: 'user not found' });

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1, must_complete_setup = false WHERE user_id = $2',
    [hash, claims.user_id]
  );
  await logAudit({ schoolId: rows[0].school_id, userId: claims.user_id, action: 'PASSWORD_RESET_SELF_SERVICE', status: 'SUCCESS', ip: req.ip });
  res.json({ ok: true });
});

router.get('/security-questions/catalog', (req, res) => {
  res.json({ questions: SECURITY_QUESTIONS, required_count: REQUIRED_QUESTION_COUNT });
});

module.exports = router;
