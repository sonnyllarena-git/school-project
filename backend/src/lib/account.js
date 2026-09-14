const pool = require('../db');

const CURRENT_SCHOOL_YEAR = '2025-2026';

// Enrollment status is always computed from fee_items vs payments — never
// stored or manually overridden (a deliberate choice, see LESSONS.md). Shared
// by every place that needs it (single-student lookups here, and the bulk
// per-student summaries in accounts.js/admin.js) so the formula can't drift.
function computeStatus(totalAssessed, totalPaid) {
  // Never negative — an overpayment (or a fee item edited down after a
  // payment was already recorded against the old, higher total) shows as
  // ₱0 owing, not a negative balance. The excess simply isn't tracked as a
  // credit; there's no such concept in this ledger.
  const balance = Math.max(0, Math.round((totalAssessed - totalPaid) * 100) / 100);
  const status = totalPaid <= 0 ? 'PENDING_PAYMENT' : balance <= 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';
  return { balance, status };
}

// A student's class_id only moves to the next grade's class when the
// Certificate of Matriculation is actually issued (enrollment.js) — so while
// re-enrollment is still in progress (VERIFIED/ASSESSED/PRINTED), the
// student's *current* class still points at their outgoing grade. An account
// lookup for the school year they're being promoted INTO must not show that
// outgoing grade/section/adviser — it needs to show the incoming one instead
// (same section letter, whatever adviser that section already has), which is
// what a parent reviewing the incoming-grade SOA actually needs to see.
async function getClassInfo(studentId, schoolYear) {
  const { rows: enrollmentRows } = await pool.query(
    'SELECT grade_level FROM enrollments WHERE student_id = $1 AND school_year = $2',
    [studentId, schoolYear]
  );
  if (enrollmentRows[0]) {
    const { rows } = await pool.query(
      `SELECT c.grade_level, c.section, u.name AS adviser_name
       FROM students s
       JOIN classes cur ON cur.class_id = s.class_id
       JOIN classes c ON c.school_id = cur.school_id AND c.grade_level = $2 AND c.section = cur.section
       LEFT JOIN teachers t ON t.teacher_id = c.teacher_id
       LEFT JOIN users u ON u.user_id = t.user_id
       WHERE s.student_id = $1`,
      [studentId, enrollmentRows[0].grade_level]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT c.grade_level, c.section, u.name AS adviser_name
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN teachers t ON t.teacher_id = c.teacher_id
     LEFT JOIN users u ON u.user_id = t.user_id
     WHERE s.student_id = $1`,
    [studentId]
  );
  return rows;
}

async function getStudentAccount(studentId, schoolYear = CURRENT_SCHOOL_YEAR) {
  const [{ rows: feeItems }, { rows: payments }, classInfo] = await Promise.all([
    pool.query(
      'SELECT fee_item_id, fee_type, amount, description FROM fee_items WHERE student_id = $1 AND school_year = $2 ORDER BY fee_type',
      [studentId, schoolYear]
    ),
    pool.query(
      'SELECT payment_id, amount, payment_date, method, reference_no, notes FROM payments WHERE student_id = $1 AND school_year = $2 ORDER BY payment_date',
      [studentId, schoolYear]
    ),
    getClassInfo(studentId, schoolYear),
  ]);

  const totalAssessed = feeItems.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const { balance, status } = computeStatus(totalAssessed, totalPaid);

  return {
    school_year: schoolYear,
    grade_level: classInfo[0]?.grade_level ?? null,
    section: classInfo[0]?.section ?? null,
    adviser_name: classInfo[0]?.adviser_name ?? null,
    fee_items: feeItems, payments, total_assessed: totalAssessed, total_paid: totalPaid, balance, status,
  };
}

module.exports = { getStudentAccount, computeStatus, CURRENT_SCHOOL_YEAR };
