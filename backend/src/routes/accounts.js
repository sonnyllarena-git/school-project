const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStudentAccount, computeStatus, CURRENT_SCHOOL_YEAR } = require('../lib/account');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN', 'REGISTRAR'));

// Returns every student with their grade/section/adviser plus computed
// payment status for the given school year — the raw material for the
// Accounts page's grade/section/status filters (filtering itself happens
// client-side; this just needs to include the fields to filter on).
router.get('/students', async (req, res) => {
  const schoolYear = req.query.school_year || CURRENT_SCHOOL_YEAR;
  const { rows } = await pool.query(
    `SELECT s.student_id, s.lrn, s.name, s.class_id, c.grade_level, c.section, u.name AS adviser_name,
            COALESCE(fi.total_assessed, 0) AS total_assessed, COALESCE(p.total_paid, 0) AS total_paid
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN teachers t ON t.teacher_id = c.teacher_id
     LEFT JOIN users u ON u.user_id = t.user_id
     LEFT JOIN (SELECT student_id, SUM(amount) AS total_assessed FROM fee_items WHERE school_year = $2 GROUP BY student_id) fi
       ON fi.student_id = s.student_id
     LEFT JOIN (SELECT student_id, SUM(amount) AS total_paid FROM payments WHERE school_year = $2 GROUP BY student_id) p
       ON p.student_id = s.student_id
     WHERE s.school_id = $1
     ORDER BY c.grade_level, c.section, s.name`,
    [req.user.school_id, schoolYear]
  );
  const withStatus = rows.map(r => {
    const totalAssessed = Number(r.total_assessed);
    const totalPaid = Number(r.total_paid);
    const { balance, status } = computeStatus(totalAssessed, totalPaid);
    return { ...r, total_assessed: totalAssessed, total_paid: totalPaid, balance, status };
  });
  res.json(withStatus);
});

router.get('/students/:studentId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT student_id, name FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'student not found' });
  const account = await getStudentAccount(req.params.studentId, req.query.school_year || CURRENT_SCHOOL_YEAR);
  res.json({ student_id: rows[0].student_id, name: rows[0].name, ...account });
});

router.post('/students/:studentId/payments', async (req, res) => {
  const { amount, payment_date, method, reference_no, notes, school_year } = req.body;
  if (!amount || Number(amount) <= 0 || !payment_date || !['CASH', 'GCASH', 'BANK_TRANSFER'].includes(method)) {
    return res.status(400).json({ error: 'amount (>0), payment_date, and a valid method (CASH/GCASH/BANK_TRANSFER) are required' });
  }
  const { rows } = await pool.query(
    'SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'student not found' });

  const targetYear = school_year || CURRENT_SCHOOL_YEAR;
  await pool.query(
    `INSERT INTO payments (payment_id, student_id, school_year, amount, payment_date, method, reference_no, recorded_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [crypto.randomUUID(), req.params.studentId, targetYear, amount, payment_date, method, reference_no || null, req.user.user_id, notes || null]
  );

  res.status(201).json(await getStudentAccount(req.params.studentId, targetYear));
});

module.exports = router;
