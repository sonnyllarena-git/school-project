const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { REQUIREMENT_TYPES } = require('../lib/curriculum');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN', 'REGISTRAR'));

router.get('/types', (req, res) => res.json(REQUIREMENT_TYPES));

// Every student plus how many of the fixed requirement types are VERIFIED
// for them — the raw material for the checklist picker and the "who's
// incomplete" filter. Rows only exist in student_requirements once a status
// has actually been set (see the PATCH route below), so a plain COUNT
// naturally treats "no row yet" as not-yet-verified.
router.get('/students', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.student_id, s.lrn, s.name, c.grade_level, c.section,
            COALESCE(v.verified_count, 0) AS verified_count
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN (
       SELECT student_id, COUNT(*) AS verified_count FROM student_requirements
       WHERE status = 'VERIFIED' GROUP BY student_id
     ) v ON v.student_id = s.student_id
     WHERE s.school_id = $1
     ORDER BY c.grade_level, c.section, s.name`,
    [req.user.school_id]
  );
  const total = REQUIREMENT_TYPES.length;
  res.json(rows.map(r => ({
    ...r,
    verified_count: Number(r.verified_count),
    total_required: total,
    complete: Number(r.verified_count) === total,
  })));
});

// Registrar dashboard snapshot: how many students have every requirement
// verified versus still missing at least one.
router.get('/summary', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.student_id, COALESCE(v.verified_count, 0) AS verified_count
     FROM students s
     LEFT JOIN (
       SELECT student_id, COUNT(*) AS verified_count FROM student_requirements
       WHERE status = 'VERIFIED' GROUP BY student_id
     ) v ON v.student_id = s.student_id
     WHERE s.school_id = $1`,
    [req.user.school_id]
  );
  const total = REQUIREMENT_TYPES.length;
  const complete = rows.filter(r => Number(r.verified_count) === total).length;
  res.json({ total_students: rows.length, complete, incomplete: rows.length - complete });
});

async function getChecklist(studentId) {
  const { rows } = await pool.query(
    `SELECT requirement_type, status, submitted_at, verified_at, verified_by, notes
     FROM student_requirements WHERE student_id = $1`,
    [studentId]
  );
  const byType = Object.fromEntries(rows.map(r => [r.requirement_type, r]));
  return REQUIREMENT_TYPES.map(type => byType[type] || {
    requirement_type: type, status: 'PENDING', submitted_at: null, verified_at: null, verified_by: null, notes: null,
  });
}

router.get('/students/:studentId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT student_id, lrn, name FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'student not found' });
  res.json({ ...rows[0], checklist: await getChecklist(req.params.studentId) });
});

router.patch('/students/:studentId/:requirementType', async (req, res) => {
  const { status, notes } = req.body;
  if (!['PENDING', 'SUBMITTED', 'VERIFIED'].includes(status)) {
    return res.status(400).json({ error: "status must be one of: PENDING, SUBMITTED, VERIFIED" });
  }
  if (!REQUIREMENT_TYPES.includes(req.params.requirementType)) {
    return res.status(400).json({ error: 'unknown requirement type' });
  }
  const { rows } = await pool.query(
    'SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'student not found' });

  const submittedAt = status === 'SUBMITTED' || status === 'VERIFIED' ? new Date() : null;
  const verifiedAt = status === 'VERIFIED' ? new Date() : null;
  const verifiedBy = status === 'VERIFIED' ? req.user.user_id : null;

  await pool.query(
    `INSERT INTO student_requirements (requirement_id, student_id, requirement_type, status, submitted_at, verified_at, verified_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (student_id, requirement_type)
     DO UPDATE SET status = $4,
                   submitted_at = COALESCE(student_requirements.submitted_at, $5),
                   verified_at = $6, verified_by = $7, notes = $8`,
    [crypto.randomUUID(), req.params.studentId, req.params.requirementType, status, submittedAt, verifiedAt, verifiedBy, notes ?? null]
  );
  res.json({ student_id: req.params.studentId, checklist: await getChecklist(req.params.studentId) });
});

module.exports = router;
