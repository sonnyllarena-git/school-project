const pool = require('../db');

const CURRENT_SCHOOL_YEAR = '2025-2026';

// Enrollment status is always computed from fee_items vs payments — never
// stored or manually overridden (a deliberate choice, see LESSONS.md).
async function getStudentAccount(studentId, schoolYear = CURRENT_SCHOOL_YEAR) {
  const [{ rows: feeItems }, { rows: payments }] = await Promise.all([
    pool.query(
      'SELECT fee_item_id, fee_type, amount, description FROM fee_items WHERE student_id = $1 AND school_year = $2 ORDER BY fee_type',
      [studentId, schoolYear]
    ),
    pool.query(
      'SELECT payment_id, amount, payment_date, method, reference_no, notes FROM payments WHERE student_id = $1 AND school_year = $2 ORDER BY payment_date',
      [studentId, schoolYear]
    ),
  ]);

  const totalAssessed = feeItems.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.round((totalAssessed - totalPaid) * 100) / 100;
  const status = totalPaid <= 0 ? 'PENDING_PAYMENT' : balance <= 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';

  return { school_year: schoolYear, fee_items: feeItems, payments, total_assessed: totalAssessed, total_paid: totalPaid, balance, status };
}

module.exports = { getStudentAccount, CURRENT_SCHOOL_YEAR };
