const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('TEACHER'));

async function findOwnClass(classId, userId) {
  const { rows } = await pool.query(
    `SELECT c.class_id FROM classes c
     JOIN teachers t ON t.teacher_id = c.teacher_id
     WHERE c.class_id = $1 AND t.user_id = $2`,
    [classId, userId]
  );
  return rows[0] || null;
}

router.post('/classes/:classId/attendance', async (req, res) => {
  const { classId } = req.params;
  const { date, records } = req.body;
  if (!date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'date and a non-empty records array are required' });
  }
  const own = await findOwnClass(classId, req.user.user_id);
  if (!own) {
    return res.status(403).json({ error: 'not your class' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      if (!r.student_id || !['PRESENT', 'ABSENT', 'TARDY'].includes(r.status)) {
        throw Object.assign(new Error('invalid record'), { status: 400 });
      }
      await client.query(
        `INSERT INTO attendance (attendance_id, class_id, student_id, date, status, time_in, notes, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (class_id, student_id, date)
         DO UPDATE SET status = $5, time_in = $6, notes = $7, recorded_by = $8, recorded_at = now()`,
        [`ATT-${classId}-${r.student_id}-${date}`, classId, r.student_id, date, r.status, r.time_in || null, r.notes || '', req.user.user_id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status === 400) return res.status(400).json({ error: 'each record needs student_id and a valid status' });
    throw err;
  } finally {
    client.release();
  }

  res.json({ classId, date, recorded: records.length });
});

router.get('/classes/:classId/attendance', async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;
  const own = await findOwnClass(classId, req.user.user_id);
  if (!own) {
    return res.status(403).json({ error: 'not your class' });
  }
  const { rows } = await pool.query(
    `SELECT student_id, date, status, time_in, notes FROM attendance
     WHERE class_id = $1 ${date ? 'AND date = $2' : ''} ORDER BY date, student_id`,
    date ? [classId, date] : [classId]
  );
  res.json(rows);
});

router.post('/classes/:classId/grades', async (req, res) => {
  const { classId } = req.params;
  const { subject, grading_period, records } = req.body;
  if (!subject || !grading_period || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'subject, grading_period, and a non-empty records array are required' });
  }
  const own = await findOwnClass(classId, req.user.user_id);
  if (!own) {
    return res.status(403).json({ error: 'not your class' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      if (!r.student_id) {
        throw Object.assign(new Error('invalid record'), { status: 400 });
      }
      const final = r.final_grade ?? null;
      await client.query(
        `INSERT INTO grades (grade_id, class_id, student_id, subject, grading_period,
                              first_period_exam, second_period_exam, third_period_exam, formative_score, final_grade, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (class_id, student_id, subject, grading_period)
         DO UPDATE SET first_period_exam = $6, second_period_exam = $7, third_period_exam = $8,
                        formative_score = $9, final_grade = $10, recorded_by = $11, recorded_at = now()`,
        [`GRD-${classId}-${r.student_id}-${subject.replace(/\s+/g, '')}-${grading_period.replace(/\s+/g, '')}`,
          classId, r.student_id, subject, grading_period,
          r.first_period_exam ?? null, r.second_period_exam ?? null, r.third_period_exam ?? null,
          r.formative_score ?? null, final, req.user.user_id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status === 400) return res.status(400).json({ error: 'each record needs a student_id' });
    throw err;
  } finally {
    client.release();
  }

  res.json({ classId, subject, grading_period, recorded: records.length });
});

module.exports = router;
