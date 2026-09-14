const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStudentAccount, computeStatus, getActiveSchoolYear, CURRENT_SCHOOL_YEAR } = require('../lib/account');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN', 'REGISTRAR'));

// Returns every student with their grade/section/adviser plus computed
// payment status for the given school year — the raw material for the
// Accounts page's grade/section/status filters (filtering itself happens
// client-side; this just needs to include the fields to filter on).
router.get('/students', async (req, res) => {
  // An explicit school_year pins every row to that one year (e.g. a report
  // for a specific year). Without one, each student's OWN active year is
  // used — CURRENT_SCHOOL_YEAR, unless they already have a certificate
  // issued for the next year, in which case that's now their live
  // obligation (see getActiveSchoolYear in lib/account.js for why).
  const pinnedYear = req.query.school_year || null;
  const { rows } = await pool.query(
    `SELECT s.student_id, s.lrn, s.name, s.class_id, c.grade_level, c.section, u.name AS adviser_name,
            effective.school_year,
            COALESCE(fi.total_assessed, 0) AS total_assessed, COALESCE(p.total_paid, 0) AS total_paid
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN teachers t ON t.teacher_id = c.teacher_id
     LEFT JOIN users u ON u.user_id = t.user_id
     LEFT JOIN LATERAL (
       SELECT COALESCE(
         $3::text,
         (SELECT school_year FROM enrollments e WHERE e.student_id = s.student_id AND e.status = 'CERTIFICATE_ISSUED' ORDER BY school_year DESC LIMIT 1),
         $2
       ) AS school_year
     ) effective ON true
     LEFT JOIN (SELECT student_id, school_year, SUM(amount) AS total_assessed FROM fee_items GROUP BY student_id, school_year) fi
       ON fi.student_id = s.student_id AND fi.school_year = effective.school_year
     LEFT JOIN (SELECT student_id, school_year, SUM(amount) AS total_paid FROM payments GROUP BY student_id, school_year) p
       ON p.student_id = s.student_id AND p.school_year = effective.school_year
     WHERE s.school_id = $1
     ORDER BY c.grade_level, c.section, s.name`,
    [req.user.school_id, CURRENT_SCHOOL_YEAR, pinnedYear]
  );
  const withStatus = rows.map(r => {
    const totalAssessed = Number(r.total_assessed);
    const totalPaid = Number(r.total_paid);
    const { balance, status } = computeStatus(totalAssessed, totalPaid);
    return { ...r, total_assessed: totalAssessed, total_paid: totalPaid, balance, status };
  });
  res.json(withStatus);
});

// School-wide payment log for the Accounting tab — every payment, across
// every student and school year, in one place (unlike /students above,
// which is scoped to each student's own current obligation). Optional
// filters narrow it down; with none, it's the full ledger.
router.get('/ledger', async (req, res) => {
  const { school_year, method, from, to } = req.query;
  const clauses = ['s.school_id = $1'];
  const params = [req.user.school_id];
  if (school_year) { params.push(school_year); clauses.push(`p.school_year = $${params.length}`); }
  if (method) { params.push(method); clauses.push(`p.method = $${params.length}`); }
  if (from) { params.push(from); clauses.push(`p.payment_date >= $${params.length}`); }
  if (to) { params.push(to); clauses.push(`p.payment_date <= $${params.length}`); }
  const { rows } = await pool.query(
    `SELECT p.payment_id, p.student_id, s.name AS student_name, s.lrn, c.grade_level, c.section,
            p.school_year, p.amount, p.payment_date, p.method, p.reference_no, p.notes, p.recorded_at,
            u.name AS recorded_by_name
     FROM payments p
     JOIN students s ON s.student_id = p.student_id
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN users u ON u.user_id = p.recorded_by
     WHERE ${clauses.join(' AND ')}
     ORDER BY p.payment_date DESC, p.recorded_at DESC`,
    params
  );
  res.json(rows);
});

// School-wide totals for the Accounting tab — a blanket SUM across
// students, not the per-student clamped balance used elsewhere (that
// clamp exists so one student's card never shows a negative number; here
// we still clamp the final outstanding figure at 0 for the same display
// reason, but the assessed/paid pieces underneath it are raw sums).
router.get('/summary', async (req, res) => {
  const { school_year } = req.query;
  const feeParams = [req.user.school_id];
  const payParams = [req.user.school_id];
  let feeYearClause = '';
  let payYearClause = '';
  if (school_year) {
    feeParams.push(school_year);
    feeYearClause = `AND fi.school_year = $${feeParams.length}`;
    payParams.push(school_year);
    payYearClause = `AND p.school_year = $${payParams.length}`;
  }

  const [{ rows: assessedRows }, { rows: paidRows }, { rows: byMethodRows }, { rows: byFeeTypeRows }] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(fi.amount), 0) AS total FROM fee_items fi
       JOIN students s ON s.student_id = fi.student_id WHERE s.school_id = $1 ${feeYearClause}`,
      feeParams
    ),
    pool.query(
      `SELECT COALESCE(SUM(p.amount), 0) AS total FROM payments p
       JOIN students s ON s.student_id = p.student_id WHERE s.school_id = $1 ${payYearClause}`,
      payParams
    ),
    pool.query(
      `SELECT p.method, COALESCE(SUM(p.amount), 0) AS total FROM payments p
       JOIN students s ON s.student_id = p.student_id WHERE s.school_id = $1 ${payYearClause}
       GROUP BY p.method ORDER BY p.method`,
      payParams
    ),
    pool.query(
      `SELECT fi.fee_type, COALESCE(SUM(fi.amount), 0) AS total FROM fee_items fi
       JOIN students s ON s.student_id = fi.student_id WHERE s.school_id = $1 ${feeYearClause}
       GROUP BY fi.fee_type ORDER BY fi.fee_type`,
      feeParams
    ),
  ]);

  const totalAssessed = Number(assessedRows[0].total);
  const totalPaid = Number(paidRows[0].total);
  const totalOutstanding = Math.max(0, Math.round((totalAssessed - totalPaid) * 100) / 100);
  const collectionRatePct = totalAssessed > 0 ? Math.round((totalPaid / totalAssessed) * 1000) / 10 : null;

  res.json({
    total_assessed: totalAssessed,
    total_paid: totalPaid,
    total_outstanding: totalOutstanding,
    collection_rate_pct: collectionRatePct,
    by_method: byMethodRows.map(r => ({ method: r.method, total: Number(r.total) })),
    by_fee_type: byFeeTypeRows.map(r => ({ fee_type: r.fee_type, total: Number(r.total) })),
  });
});

router.get('/students/:studentId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT student_id, lrn, name FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'student not found' });
  const schoolYear = req.query.school_year || await getActiveSchoolYear(req.params.studentId);
  const account = await getStudentAccount(req.params.studentId, schoolYear);
  res.json({ student_id: rows[0].student_id, lrn: rows[0].lrn, name: rows[0].name, ...account });
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

  const targetYear = school_year || await getActiveSchoolYear(req.params.studentId);

  // Reject up front rather than clamping after the fact — a payment that would
  // overpay the account is almost always a typo (an extra digit, wrong student)
  // and should bounce back to the cashier instead of silently capping at ₱0 owed.
  const before = await getStudentAccount(req.params.studentId, targetYear);
  if (Number(amount) > before.balance) {
    return res.status(400).json({
      error: `payment of ${Number(amount).toFixed(2)} exceeds the outstanding balance of ${before.balance.toFixed(2)}`,
      balance: before.balance,
    });
  }

  await pool.query(
    `INSERT INTO payments (payment_id, student_id, school_year, amount, payment_date, method, reference_no, recorded_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [crypto.randomUUID(), req.params.studentId, targetYear, amount, payment_date, method, reference_no || null, req.user.user_id, notes || null]
  );

  res.status(201).json(await getStudentAccount(req.params.studentId, targetYear));
});

// Fee-item corrections — for when a parent reviews the printed SOA for the
// incoming grade and flags something wrong before paying. Not restricted to
// a particular enrollment stage or school year at the API level (that's a UI
// concern, enforced by the Enrollment page only showing these controls while
// ASSESSED/PRINTED); the ledger recalculates total_assessed/balance live from
// whatever fee_items exist, so an edit after a payment is already recorded
// just changes the resulting balance, nothing is silently lost.
router.post('/students/:studentId/fee-items', async (req, res) => {
  const { school_year, fee_type, amount, description } = req.body;
  if (!school_year || !fee_type?.trim() || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'school_year, fee_type, and amount (>0) are required' });
  }
  const { rows } = await pool.query(
    'SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'student not found' });

  await pool.query(
    `INSERT INTO fee_items (fee_item_id, student_id, school_year, fee_type, amount, description)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [crypto.randomUUID(), req.params.studentId, school_year, fee_type.trim(), amount, description || null]
  );
  res.status(201).json(await getStudentAccount(req.params.studentId, school_year));
});

async function findOwnFeeItem(feeItemId, studentId, schoolId) {
  const { rows } = await pool.query(
    `SELECT fi.fee_item_id, fi.school_year
     FROM fee_items fi JOIN students s ON s.student_id = fi.student_id
     WHERE fi.fee_item_id = $1 AND fi.student_id = $2 AND s.school_id = $3`,
    [feeItemId, studentId, schoolId]
  );
  return rows[0] || null;
}

router.patch('/students/:studentId/fee-items/:feeItemId', async (req, res) => {
  const item = await findOwnFeeItem(req.params.feeItemId, req.params.studentId, req.user.school_id);
  if (!item) return res.status(404).json({ error: 'fee item not found' });

  const { fee_type, amount, description } = req.body;
  const updates = [];
  const values = [];
  if (fee_type !== undefined) { values.push(fee_type.trim()); updates.push(`fee_type = $${values.length}`); }
  if (amount !== undefined) {
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'amount must be greater than 0' });
    values.push(amount); updates.push(`amount = $${values.length}`);
  }
  if (description !== undefined) { values.push(description || null); updates.push(`description = $${values.length}`); }
  if (!updates.length) return res.status(400).json({ error: 'no fields to update' });

  values.push(req.params.feeItemId);
  await pool.query(`UPDATE fee_items SET ${updates.join(', ')} WHERE fee_item_id = $${values.length}`, values);
  res.json(await getStudentAccount(req.params.studentId, item.school_year));
});

router.delete('/students/:studentId/fee-items/:feeItemId', async (req, res) => {
  const item = await findOwnFeeItem(req.params.feeItemId, req.params.studentId, req.user.school_id);
  if (!item) return res.status(404).json({ error: 'fee item not found' });

  await pool.query('DELETE FROM fee_items WHERE fee_item_id = $1', [req.params.feeItemId]);
  res.json(await getStudentAccount(req.params.studentId, item.school_year));
});

module.exports = router;
