const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStudentAccount, CURRENT_SCHOOL_YEAR } = require('../lib/account');
const { SUBJECTS, nextSchoolYear } = require('../lib/curriculum');

const NEXT_SCHOOL_YEAR = nextSchoolYear(CURRENT_SCHOOL_YEAR);

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

router.get('/account', async (req, res) => {
  const studentId = await ownStudentId(req.user.user_id);
  if (!studentId) return res.status(404).json({ error: 'no student record linked to this account' });
  res.json(await getStudentAccount(studentId));
});

// Weekly class schedule for the student's own grade — the mock schedule set
// up per subject on the admin Subjects tab (backend/src/routes/admin.js).
router.get('/schedule', async (req, res) => {
  const studentId = await ownStudentId(req.user.user_id);
  if (!studentId) return res.status(404).json({ error: 'no student record linked to this account' });

  const { rows: classRows } = await pool.query(
    `SELECT c.grade_level, c.section FROM students s JOIN classes c ON c.class_id = s.class_id WHERE s.student_id = $1`,
    [studentId]
  );
  const gradeLevel = classRows[0]?.grade_level;
  if (gradeLevel == null) return res.json({ grade_level: null, section: null, subjects: [] });

  const { rows: subjects } = await pool.query(
    `SELECT subject_id, code, name, schedule_days, start_time, end_time, room
     FROM subjects WHERE school_id = $1 AND grade_level = $2 ORDER BY start_time NULLS LAST, name`,
    [req.user.school_id, gradeLevel]
  );
  const { rows: assignments } = await pool.query(
    `SELECT ts.subject_id, u.name AS teacher_name
     FROM teacher_subjects ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE ts.subject_id = ANY($1)`,
    [subjects.map(s => s.subject_id)]
  );
  res.json({
    grade_level: gradeLevel,
    section: classRows[0]?.section,
    subjects: subjects.map(s => ({
      code: s.code,
      name: s.name,
      schedule: { days: s.schedule_days, start_time: s.start_time, end_time: s.end_time, room: s.room },
      teachers: assignments.filter(a => a.subject_id === s.subject_id).map(a => a.teacher_name),
    })),
  });
});

router.get('/enrollment', async (req, res) => {
  const studentId = await ownStudentId(req.user.user_id);
  if (!studentId) return res.status(404).json({ error: 'no student record linked to this account' });
  const { rows: classRows } = await pool.query(
    `SELECT c.grade_level, c.section FROM students s JOIN classes c ON c.class_id = s.class_id WHERE s.student_id = $1`,
    [studentId]
  );
  const { rows: enrollmentRows } = await pool.query(
    'SELECT status, verified_at, assessed_at, printed_at, certificate_issued_at FROM enrollments WHERE student_id = $1 AND school_year = $2',
    [studentId, NEXT_SCHOOL_YEAR]
  );
  res.json({
    current_grade: classRows[0]?.grade_level,
    current_section: classRows[0]?.section,
    subjects: SUBJECTS,
    next_school_year: NEXT_SCHOOL_YEAR,
    promotion: enrollmentRows[0] || null,
  });
});

router.get('/certificate', async (req, res) => {
  const studentId = await ownStudentId(req.user.user_id);
  if (!studentId) return res.status(404).json({ error: 'no student record linked to this account' });
  const { rows } = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = $1 AND school_year = $2 AND status = $3',
    [studentId, NEXT_SCHOOL_YEAR, 'CERTIFICATE_ISSUED']
  );
  if (!rows[0]) return res.status(404).json({ error: 'no issued certificate yet' });
  const { rows: studentRows } = await pool.query('SELECT name, lrn, school_id FROM students WHERE student_id = $1', [studentId]);
  const { rows: schoolRows } = await pool.query('SELECT name, principal, deped_id FROM schools WHERE school_id = $1', [studentRows[0].school_id]);
  res.json({
    student_name: studentRows[0].name,
    lrn: studentRows[0].lrn,
    school_year: rows[0].school_year,
    grade_level: rows[0].grade_level,
    section: 'A',
    subjects: SUBJECTS,
    issued_at: rows[0].certificate_issued_at,
    school: schoolRows[0],
  });
});

module.exports = router;
