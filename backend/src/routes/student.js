const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('STUDENT'));

async function ownStudentId(userId) {
  const { rows } = await pool.query('SELECT student_id FROM students WHERE user_id = $1', [userId]);
  return rows[0]?.student_id || null;
}

router.get('/grades', async (req, res) => {
  const studentId = await ownStudentId(req.user.user_id);
  if (!studentId) return res.status(404).json({ error: 'no student record linked to this account' });
  const { rows } = await pool.query(
    'SELECT subject, grading_period, first_period_exam, second_period_exam, third_period_exam, formative_score, final_grade FROM grades WHERE student_id = $1 ORDER BY grading_period, subject',
    [studentId]
  );
  res.json(rows);
});

router.get('/attendance', async (req, res) => {
  const studentId = await ownStudentId(req.user.user_id);
  if (!studentId) return res.status(404).json({ error: 'no student record linked to this account' });
  const { rows } = await pool.query(
    'SELECT date, status, time_in FROM attendance WHERE student_id = $1 ORDER BY date',
    [studentId]
  );
  res.json(rows);
});

module.exports = router;
