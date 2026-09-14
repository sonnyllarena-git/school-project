const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { SECURITY_QUESTIONS, REQUIRED_QUESTION_COUNT } = require('../lib/securityQuestions');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT user_id, name, email, role, notify_email, notify_sms, must_complete_setup FROM users WHERE user_id = $1',
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

// Which of the fixed catalog questions this user has already configured
// (text only, never the answers back).
router.get('/security-questions', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT question FROM security_questions WHERE user_id = $1 ORDER BY question',
    [req.user.user_id]
  );
  res.json({ questions: rows.map(r => r.question) });
});

// Full replace, not a partial patch — a user always sets/updates their
// whole set of REQUIRED_QUESTION_COUNT questions together, never adds one
// at a time. This is the actual "first-time setup is done" signal: clears
// must_complete_setup regardless of whether this is initial setup or a
// later voluntary change (harmless either way — if it was already false,
// setting it false again is a no-op).
router.post('/security-questions', async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length !== REQUIRED_QUESTION_COUNT) {
    return res.status(400).json({ error: `Exactly ${REQUIRED_QUESTION_COUNT} questions are required` });
  }
  const seen = new Set();
  for (const q of questions) {
    if (!SECURITY_QUESTIONS.includes(q.question)) {
      return res.status(400).json({ error: `Unknown question: ${q.question}` });
    }
    if (seen.has(q.question)) {
      return res.status(400).json({ error: 'Questions must be distinct' });
    }
    seen.add(q.question);
    if (!q.answer || !q.answer.trim()) {
      return res.status(400).json({ error: 'Every question needs an answer' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM security_questions WHERE user_id = $1', [req.user.user_id]);
    for (const q of questions) {
      const hash = await bcrypt.hash(q.answer.trim().toLowerCase(), 10);
      await client.query(
        `INSERT INTO security_questions (question_id, user_id, question, answer_hash)
         VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), req.user.user_id, q.question, hash]
      );
    }
    await client.query('UPDATE users SET must_complete_setup = false WHERE user_id = $1', [req.user.user_id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.json({ updated: true });
});

module.exports = router;
