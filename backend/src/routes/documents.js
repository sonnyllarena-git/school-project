const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
// Registrar-owned per the user's own scoping — Cashier document access
// (e.g. printing an SOA/receipt) is a deliberately deferred decision, not
// built this round.
router.use(requireAuth, requireRole('ADMIN', 'REGISTRAR'));

async function getStudentHeader(studentId, schoolId) {
  const { rows } = await pool.query(
    `SELECT s.student_id, s.lrn, s.name, s.gender, c.grade_level, c.section, u.name AS adviser_name
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN teachers t ON t.teacher_id = c.teacher_id
     LEFT JOIN users u ON u.user_id = t.user_id
     WHERE s.student_id = $1 AND s.school_id = $2`,
    [studentId, schoolId]
  );
  if (!rows[0]) return null;
  const { rows: schoolRows } = await pool.query('SELECT name, principal, deped_id FROM schools WHERE school_id = $1', [schoolId]);
  return { ...rows[0], school: schoolRows[0] };
}

router.get('/students/:studentId/good-moral', async (req, res) => {
  const header = await getStudentHeader(req.params.studentId, req.user.school_id);
  if (!header) return res.status(404).json({ error: 'student not found' });
  res.json(header);
});

router.get('/students/:studentId/honorable-dismissal', async (req, res) => {
  const header = await getStudentHeader(req.params.studentId, req.user.school_id);
  if (!header) return res.status(404).json({ error: 'student not found' });
  res.json(header);
});

// Cumulative across every grade level a student has ever been recorded
// under — grouped by classes.grade_level (grades has no school_year column
// of its own; a grade row's class_id already pins it to whichever grade
// level it was recorded in, which is exactly what a transcript needs).
router.get('/students/:studentId/transcript', async (req, res) => {
  const header = await getStudentHeader(req.params.studentId, req.user.school_id);
  if (!header) return res.status(404).json({ error: 'student not found' });
  const { rows: grades } = await pool.query(
    `SELECT c.grade_level, g.subject, g.grading_period, g.final_grade
     FROM grades g JOIN classes c ON c.class_id = g.class_id
     WHERE g.student_id = $1
     ORDER BY c.grade_level, g.subject, g.grading_period`,
    [req.params.studentId]
  );
  res.json({ ...header, grades: grades.map(g => ({ ...g, final_grade: g.final_grade === null ? null : Number(g.final_grade) })) });
});

module.exports = router;
