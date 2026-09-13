const pool = require('../db');

const CURRENT_SCHOOL_YEAR = '2025-2026';

// Enrollment status is always computed from fee_items vs payments — never
// stored or manually overridden (a deliberate choice, see LESSONS.md). Shared
// by every place that needs it (single-student lookups here, and the bulk
// per-student summaries in accounts.js/admin.js) so the formula can't drift.
function computeStatus(totalAssessed, totalPaid) {
  const balance = Math.round((totalAssessed - totalPaid) * 100) / 100;
  const status = totalPaid <= 0 ? 'PENDING_PAYMENT' : balance <= 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';
  return { balance, status };
}

async function getStudentAccount(studentId, schoolYear = CURRENT_SCHOOL_YEAR) {
  const [{ rows: feeItems }, { rows: payments }, { rows: classInfo }] = await Promise.all([
    pool.query(
      'SELECT fee_item_id, fee_type, amount, description FROM fee_items WHERE student_id = $1 AND school_year = $2 ORDER BY fee_type',
      [studentId, schoolYear]
    ),
    pool.query(
      'SELECT payment_id, amount, payment_date, method, reference_no, notes FROM payments WHERE student_id = $1 AND school_year = $2 ORDER BY payment_date',
      [studentId, schoolYear]
    ),
    pool.query(
      `SELECT c.grade_level, c.section, u.name AS adviser_name
       FROM students s
       LEFT JOIN classes c ON c.class_id = s.class_id
       LEFT JOIN teachers t ON t.teacher_id = c.teacher_id
       LEFT JOIN users u ON u.user_id = t.user_id
       WHERE s.student_id = $1`,
      [studentId]
    ),
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
