const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseCsv, toCsv } = require('../lib/csv');
const { encrypt, decrypt } = require('../lib/crypto');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/students', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT student_id, lrn, name, date_of_birth, gender, class_id, status
     FROM students WHERE school_id = $1 ORDER BY class_id, name`,
    [req.user.school_id]
  );
  rows.forEach(r => { if (r.date_of_birth) r.date_of_birth = decrypt(r.date_of_birth); });
  res.json(rows);
});

// Right-to-deletion (CLAUDE.md §1.1): permanently removes a student's academic
// records and login account. The student's own audit trail is purged with the
// account (nothing left for it to describe); a fresh audit_log row is written
// for THIS action, attributed to the admin who performed it, as the compliance
// record that the deletion happened.
router.delete('/students/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { rows: existing } = await pool.query(
    'SELECT user_id FROM students WHERE student_id = $1 AND school_id = $2',
    [studentId, req.user.school_id]
  );
  if (!existing[0]) {
    return res.status(404).json({ error: 'student not found' });
  }
  const studentUserId = existing[0].user_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM attendance WHERE student_id = $1', [studentId]);
    await client.query('DELETE FROM grades WHERE student_id = $1', [studentId]);
    await client.query('DELETE FROM fee_items WHERE student_id = $1', [studentId]);
    await client.query('DELETE FROM payments WHERE student_id = $1', [studentId]);
    await client.query('DELETE FROM enrollments WHERE student_id = $1', [studentId]);
    await client.query('DELETE FROM students WHERE student_id = $1', [studentId]);
    if (studentUserId) {
      await client.query('DELETE FROM audit_logs WHERE user_id = $1', [studentUserId]);
      await client.query('DELETE FROM users WHERE user_id = $1', [studentUserId]);
    }
    await client.query(
      `INSERT INTO audit_logs (audit_id, school_id, user_id, action, table_affected, record_count, status)
       VALUES ($1, $2, $3, 'RIGHT_TO_DELETION', 'students', 1, 'SUCCESS')`,
      [crypto.randomUUID(), req.user.school_id, req.user.user_id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ deleted: studentId });
});

router.get('/school', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM schools WHERE school_id = $1', [req.user.school_id]);
  res.json(rows[0] || null);
});

router.patch('/school', async (req, res) => {
  const allowed = ['name', 'address', 'phone', 'email', 'school_year', 'principal', 'region'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (updates.length === 0) {
    return res.status(400).json({ error: 'no valid fields to update' });
  }
  const setClause = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = updates.map(k => req.body[k]);
  const { rows } = await pool.query(
    `UPDATE schools SET ${setClause} WHERE school_id = $1 RETURNING *`,
    [req.user.school_id, ...values]
  );
  res.json(rows[0]);
});

router.get('/teachers', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.teacher_id, u.user_id, u.name, u.email
     FROM teachers t JOIN users u ON u.user_id = t.user_id
     WHERE t.school_id = $1 ORDER BY u.name`,
    [req.user.school_id]
  );
  res.json(rows);
});

router.post('/teachers', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  const userId = `USR-TCH-${crypto.randomUUID().slice(0, 8)}`;
  const teacherId = `TCH-${crypto.randomUUID().slice(0, 8)}`;
  const hash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO users (user_id, school_id, email, password_hash, role, name)
       VALUES ($1, $2, $3, $4, 'TEACHER', $5)`,
      [userId, req.user.school_id, email, hash, name]
    );
    await client.query(
      'INSERT INTO teachers (teacher_id, user_id, school_id) VALUES ($1, $2, $3)',
      [teacherId, userId, req.user.school_id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'a user with that email already exists' });
    }
    throw err;
  } finally {
    client.release();
  }

  res.status(201).json({ teacher_id: teacherId, user_id: userId, name, email });
});

// CSV columns: lrn,name,date_of_birth,gender,class_id
// Upserts by lrn (the natural student identifier) so re-import is idempotent.
router.post('/students/import', async (req, res) => {
  const { csv } = req.body;
  if (!csv) {
    return res.status(400).json({ error: 'csv field is required' });
  }
  const rows = parseCsv(csv);
  const required = ['lrn', 'name', 'date_of_birth', 'gender', 'class_id'];
  for (const r of rows) {
    for (const field of required) {
      if (!r[field]) {
        return res.status(400).json({ error: `row missing "${field}"`, lrn: r.lrn || null });
      }
    }
  }

  const classIds = [...new Set(rows.map(r => r.class_id))];
  const { rows: validClasses } = await pool.query(
    'SELECT class_id FROM classes WHERE school_id = $1 AND class_id = ANY($2)',
    [req.user.school_id, classIds]
  );
  const validSet = new Set(validClasses.map(c => c.class_id));
  const badRows = rows.filter(r => !validSet.has(r.class_id));
  if (badRows.length > 0) {
    return res.status(400).json({ error: 'unknown class_id(s)', lrns: badRows.map(r => r.lrn) });
  }

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      const { rows: existing } = await client.query('SELECT student_id FROM students WHERE lrn = $1', [r.lrn]);
      if (existing[0]) {
        await client.query(
          'UPDATE students SET name = $1, date_of_birth = $2, gender = $3, class_id = $4 WHERE lrn = $5',
          [r.name, encrypt(r.date_of_birth), r.gender, r.class_id, r.lrn]
        );
        updated++;
      } else {
        const studentId = `STU-${crypto.randomUUID().slice(0, 8)}`;
        await client.query(
          `INSERT INTO students (student_id, lrn, school_id, class_id, name, date_of_birth, gender, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
          [studentId, r.lrn, req.user.school_id, r.class_id, r.name, encrypt(r.date_of_birth), r.gender]
        );
        inserted++;
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ inserted, updated, total: rows.length });
});

router.get('/reports/attendance', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.class_id, c.grade_level, c.section,
            COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
            COUNT(*) AS total
     FROM attendance a
     JOIN classes c ON c.class_id = a.class_id
     WHERE c.school_id = $1
     GROUP BY c.class_id, c.grade_level, c.section
     ORDER BY c.grade_level`,
    [req.user.school_id]
  );
  const perClass = rows.map(r => ({
    class_id: r.class_id,
    grade_level: r.grade_level,
    section: r.section,
    present: Number(r.present),
    total: Number(r.total),
    attendance_pct: r.total > 0 ? Math.round((r.present / r.total) * 1000) / 10 : null,
  }));
  const totalPresent = perClass.reduce((s, r) => s + r.present, 0);
  const totalAll = perClass.reduce((s, r) => s + r.total, 0);
  res.json({
    overall_attendance_pct: totalAll > 0 ? Math.round((totalPresent / totalAll) * 1000) / 10 : null,
    per_class: perClass,
  });
});

router.get('/reports/grades', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE g.final_grade >= 90) AS excellent,
       COUNT(*) FILTER (WHERE g.final_grade >= 80 AND g.final_grade < 90) AS very_good,
       COUNT(*) FILTER (WHERE g.final_grade >= 70 AND g.final_grade < 80) AS good,
       COUNT(*) FILTER (WHERE g.final_grade < 70) AS needs_improvement,
       COUNT(*) AS total
     FROM grades g
     JOIN students s ON s.student_id = g.student_id
     WHERE s.school_id = $1`,
    [req.user.school_id]
  );
  const r = rows[0];
  res.json({
    excellent_90_100: Number(r.excellent),
    very_good_80_89: Number(r.very_good),
    good_70_79: Number(r.good),
    needs_improvement_below_70: Number(r.needs_improvement),
    total: Number(r.total),
  });
});

const EXPORTABLE = {
  students: {
    columns: ['student_id', 'lrn', 'name', 'date_of_birth', 'gender', 'class_id', 'status'],
    decryptFields: ['date_of_birth'],
    query: (schoolId, { class_id }) => ({
      sql: `SELECT student_id, lrn, name, date_of_birth, gender, class_id, status
            FROM students WHERE school_id = $1 ${class_id ? 'AND class_id = $2' : ''} ORDER BY class_id, lrn`,
      params: class_id ? [schoolId, class_id] : [schoolId],
    }),
  },
  teachers: {
    columns: ['teacher_id', 'name', 'email'],
    query: schoolId => ({
      sql: `SELECT t.teacher_id, u.name, u.email FROM teachers t
            JOIN users u ON u.user_id = t.user_id WHERE t.school_id = $1 ORDER BY u.name`,
      params: [schoolId],
    }),
  },
  attendance: {
    columns: ['class_id', 'student_id', 'date', 'status', 'time_in'],
    query: (schoolId, { class_id, student_id, from, to }) => {
      const clauses = ['c.school_id = $1'];
      const params = [schoolId];
      if (class_id) { params.push(class_id); clauses.push(`a.class_id = $${params.length}`); }
      if (student_id) { params.push(student_id); clauses.push(`a.student_id = $${params.length}`); }
      if (from) { params.push(from); clauses.push(`a.date >= $${params.length}`); }
      if (to) { params.push(to); clauses.push(`a.date <= $${params.length}`); }
      return {
        sql: `SELECT a.class_id, a.student_id, a.date, a.status, a.time_in FROM attendance a
              JOIN classes c ON c.class_id = a.class_id WHERE ${clauses.join(' AND ')} ORDER BY a.date, a.class_id`,
        params,
      };
    },
  },
  grades: {
    columns: ['class_id', 'student_id', 'subject', 'grading_period', 'first_period_exam', 'second_period_exam', 'third_period_exam', 'formative_score', 'final_grade'],
    query: (schoolId, { class_id, student_id }) => {
      const clauses = ['c.school_id = $1'];
      const params = [schoolId];
      if (class_id) { params.push(class_id); clauses.push(`g.class_id = $${params.length}`); }
      if (student_id) { params.push(student_id); clauses.push(`g.student_id = $${params.length}`); }
      return {
        sql: `SELECT g.class_id, g.student_id, g.subject, g.grading_period, g.first_period_exam,
                     g.second_period_exam, g.third_period_exam, g.formative_score, g.final_grade
              FROM grades g JOIN classes c ON c.class_id = g.class_id
              WHERE ${clauses.join(' AND ')} ORDER BY g.class_id, g.student_id`,
        params,
      };
    },
  },
};

router.get('/export/:table', async (req, res) => {
  const spec = EXPORTABLE[req.params.table];
  if (!spec) {
    return res.status(400).json({ error: `unknown export table; use one of: ${Object.keys(EXPORTABLE).join(', ')}` });
  }
  const { sql, params } = spec.query(req.user.school_id, req.query);
  const { rows } = await pool.query(sql, params);
  if (spec.decryptFields) {
    for (const row of rows) {
      for (const field of spec.decryptFields) {
        if (row[field] != null) row[field] = decrypt(row[field]);
      }
    }
  }
  const csv = toCsv(spec.columns, rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.table}.csv"`);
  res.send(csv);
});

module.exports = router;
