const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStudentAccount, CURRENT_SCHOOL_YEAR } = require('../lib/account');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN', 'REGISTRAR'));

router.get('/students', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT student_id, lrn, name, class_id FROM students WHERE school_id = $1 ORDER BY class_id, name',
    [req.user.school_id]
  );
  res.json(rows);
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
