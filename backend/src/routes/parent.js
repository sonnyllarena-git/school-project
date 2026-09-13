const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('PARENT'));

async function isLinkedChild(userId, studentId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM student_guardians sg
     JOIN guardians g ON g.guardian_id = sg.guardian_id
     WHERE g.user_id = $1 AND sg.student_id = $2`,
    [userId, studentId]
  );
  return rows.length > 0;
}

router.get('/children', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.student_id, s.name, s.class_id
     FROM student_guardians sg
     JOIN guardians g ON g.guardian_id = sg.guardian_id
     JOIN students s ON s.student_id = sg.student_id
     WHERE g.user_id = $1
     ORDER BY s.name`,
    [req.user.user_id]
  );
  res.json(rows);
});

router.get('/children/:studentId/grades', async (req, res) => {
  const { studentId } = req.params;
  if (!(await isLinkedChild(req.user.user_id, studentId))) {
    return res.status(403).json({ error: 'not your child' });
  }
  const { rows } = await pool.query(
    'SELECT subject, grading_period, first_period_exam, second_period_exam, third_period_exam, formative_score, final_grade FROM grades WHERE student_id = $1 ORDER BY grading_period, subject',
    [studentId]
  );
  res.json(rows);
});

router.get('/children/:studentId/attendance', async (req, res) => {
  const { studentId } = req.params;
  if (!(await isLinkedChild(req.user.user_id, studentId))) {
    return res.status(403).json({ error: 'not your child' });
  }
  const { rows } = await pool.query(
    'SELECT date, status, time_in FROM attendance WHERE student_id = $1 ORDER BY date',
    [studentId]
  );
  res.json(rows);
});

module.exports = router;
