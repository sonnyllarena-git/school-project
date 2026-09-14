const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStudentAccount, CURRENT_SCHOOL_YEAR } = require('../lib/account');
const { SUBJECTS, PASSING_GRADE, feeTemplateForGrade, nextSchoolYear } = require('../lib/curriculum');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN', 'REGISTRAR'));

const NEXT_SCHOOL_YEAR = nextSchoolYear(CURRENT_SCHOOL_YEAR);

async function getStudentAndGrade(studentId, schoolId) {
  const { rows } = await pool.query(
    `SELECT s.student_id, s.name, s.class_id, c.grade_level, c.section
     FROM students s JOIN classes c ON c.class_id = s.class_id
     WHERE s.student_id = $1 AND s.school_id = $2`,
    [studentId, schoolId]
  );
  return rows[0] || null;
}

// Promotion gate: no balance owed for the current year, and no failing
// general average. Averaged across whichever quarters (grading_period) have
// been recorded so far per subject — not any single quarter's dip — since a
// school year now has 4 quarters of grades, not just one.
async function checkEligibility(studentId) {
  const account = await getStudentAccount(studentId, CURRENT_SCHOOL_YEAR);
  const { rows: gradeRows } = await pool.query(
    'SELECT subject, AVG(final_grade) AS avg_grade FROM grades WHERE student_id = $1 AND final_grade IS NOT NULL GROUP BY subject',
    [studentId]
  );
  const failingSubjects = gradeRows.filter(g => Number(g.avg_grade) < PASSING_GRADE).map(g => g.subject);
  return {
    eligible: account.balance <= 0 && failingSubjects.length === 0,
    balance: account.balance,
    failing_subjects: failingSubjects,
  };
}

// Registrar dashboard snapshot: how many students are at each promotion
// stage for the upcoming school year. Declared before the /:studentId
// routes below so Express doesn't match "summary" as a student_id.
router.get('/summary', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.status, COUNT(*) AS count FROM enrollments e
     JOIN students s ON s.student_id = e.student_id
     WHERE s.school_id = $1 AND e.school_year = $2
     GROUP BY e.status`,
    [req.user.school_id, NEXT_SCHOOL_YEAR]
  );
  const byStatus = Object.fromEntries(rows.map(r => [r.status, Number(r.count)]));
  const { rows: totalRows } = await pool.query('SELECT COUNT(*) FROM students WHERE school_id = $1', [req.user.school_id]);
  const started = Object.values(byStatus).reduce((a, b) => a + b, 0);
  res.json({
    school_year: NEXT_SCHOOL_YEAR,
    total_students: Number(totalRows[0].count),
    not_started: Number(totalRows[0].count) - started,
    verified: byStatus.VERIFIED || 0,
    assessed: byStatus.ASSESSED || 0,
    printed: byStatus.PRINTED || 0,
    certificate_issued: byStatus.CERTIFICATE_ISSUED || 0,
  });
});

router.get('/:studentId/eligibility', async (req, res) => {
  const student = await getStudentAndGrade(req.params.studentId, req.user.school_id);
  if (!student) return res.status(404).json({ error: 'student not found' });
  res.json({ ...(await checkEligibility(req.params.studentId)), current_grade: student.grade_level });
});

router.get('/:studentId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = $1 AND school_year = $2',
    [req.params.studentId, NEXT_SCHOOL_YEAR]
  );
  res.json(rows[0] || null);
});

router.post('/:studentId/verify', async (req, res) => {
  const student = await getStudentAndGrade(req.params.studentId, req.user.school_id);
  if (!student) return res.status(404).json({ error: 'student not found' });
  if (student.grade_level >= 6) {
    return res.status(400).json({ error: 'already at the highest grade level — no further promotion' });
  }
  const eligibility = await checkEligibility(req.params.studentId);
  if (!eligibility.eligible) {
    return res.status(400).json({ error: 'not eligible for promotion', ...eligibility });
  }
  const { rows } = await pool.query(
    `INSERT INTO enrollments (enrollment_id, student_id, school_year, grade_level, status, recorded_by)
     VALUES ($1, $2, $3, $4, 'VERIFIED', $5)
     ON CONFLICT (student_id, school_year)
     DO UPDATE SET status = 'VERIFIED', verified_at = now(), grade_level = $4, recorded_by = $5
     RETURNING *`,
    [crypto.randomUUID(), req.params.studentId, NEXT_SCHOOL_YEAR, student.grade_level + 1, req.user.user_id]
  );
  res.status(201).json(rows[0]);
});

router.post('/:studentId/assess', async (req, res) => {
  const { rows: existing } = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = $1 AND school_year = $2',
    [req.params.studentId, NEXT_SCHOOL_YEAR]
  );
  const enrollment = existing[0];
  if (!enrollment || enrollment.status !== 'VERIFIED') {
    return res.status(400).json({ error: 'student must be VERIFIED before assessment' });
  }

  const template = feeTemplateForGrade(enrollment.grade_level);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < template.length; i++) {
      await client.query(
        `INSERT INTO fee_items (fee_item_id, student_id, school_year, fee_type, amount, description)
         VALUES ($1, $2, $3, $4, $5, NULL)
         ON CONFLICT (fee_item_id) DO NOTHING`,
        [`FEE-${req.params.studentId}-${NEXT_SCHOOL_YEAR}-${i}`, req.params.studentId, NEXT_SCHOOL_YEAR, template[i].fee_type, template[i].amount]
      );
    }
    const { rows } = await client.query(
      `UPDATE enrollments SET status = 'ASSESSED', assessed_at = now() WHERE student_id = $1 AND school_year = $2 RETURNING *`,
      [req.params.studentId, NEXT_SCHOOL_YEAR]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/:studentId/mark-printed', async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE enrollments SET status = 'PRINTED', printed_at = now()
     WHERE student_id = $1 AND school_year = $2 AND status = 'ASSESSED' RETURNING *`,
    [req.params.studentId, NEXT_SCHOOL_YEAR]
  );
  if (!rows[0]) return res.status(400).json({ error: 'student must be ASSESSED before printing' });
  res.json(rows[0]);
});

router.post('/:studentId/issue-certificate', async (req, res) => {
  const { rows: existing } = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = $1 AND school_year = $2',
    [req.params.studentId, NEXT_SCHOOL_YEAR]
  );
  const enrollment = existing[0];
  if (!enrollment || enrollment.status !== 'PRINTED') {
    return res.status(400).json({ error: 'student must be PRINTED before the certificate can be issued' });
  }
  // At least a partial payment toward the new school year is required — full
  // payment is NOT required (a deliberate call: a school may enroll a student
  // on a partial payment plan). Zero payment (PENDING_PAYMENT) still blocks
  // issuance. Any outstanding balance simply carries forward and keeps
  // showing on the Accounts page for that school year — nothing is written
  // off by issuing the certificate.
  const account = await getStudentAccount(req.params.studentId, NEXT_SCHOOL_YEAR);
  if (account.status === 'PENDING_PAYMENT') {
    return res.status(400).json({ error: 'at least a partial payment for the new school year is required before issuing the certificate', balance: account.balance });
  }

  // Promote into the same section letter the student is already in (Grade N
  // Section X → Grade N+1 Section X) rather than assuming a single class per
  // grade — sections mean a grade can have more than one class.
  const student = await getStudentAndGrade(req.params.studentId, req.user.school_id);
  const { rows: nextClassRows } = await pool.query(
    'SELECT class_id FROM classes WHERE school_id = $1 AND grade_level = $2 AND section = $3',
    [req.user.school_id, enrollment.grade_level, student.section]
  );
  if (!nextClassRows[0]) {
    return res.status(400).json({ error: `no class found for Grade ${enrollment.grade_level} - ${student.section}` });
  }
  const newClassId = nextClassRows[0].class_id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE students SET class_id = $1 WHERE student_id = $2', [newClassId, req.params.studentId]);
    const { rows } = await client.query(
      `UPDATE enrollments SET status = 'CERTIFICATE_ISSUED', certificate_issued_at = now()
       WHERE student_id = $1 AND school_year = $2 RETURNING *`,
      [req.params.studentId, NEXT_SCHOOL_YEAR]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.get('/:studentId/certificate', async (req, res) => {
  const { rows: existing } = await pool.query(
    'SELECT * FROM enrollments WHERE student_id = $1 AND school_year = $2 AND status = $3',
    [req.params.studentId, NEXT_SCHOOL_YEAR, 'CERTIFICATE_ISSUED']
  );
  if (!existing[0]) return res.status(404).json({ error: 'no issued certificate for this student/school year' });
  const { rows: studentRows } = await pool.query(
    `SELECT s.name, s.lrn, c.section
     FROM students s LEFT JOIN classes c ON c.class_id = s.class_id
     WHERE s.student_id = $1`,
    [req.params.studentId]
  );
  const { rows: schoolRows } = await pool.query('SELECT name, principal, deped_id FROM schools WHERE school_id = $1', [req.user.school_id]);

  res.json({
    student_name: studentRows[0].name,
    lrn: studentRows[0].lrn,
    school_year: existing[0].school_year,
    grade_level: existing[0].grade_level,
    section: studentRows[0].section,
    subjects: SUBJECTS,
    issued_at: existing[0].certificate_issued_at,
    school: schoolRows[0],
  });
});

module.exports = router;
