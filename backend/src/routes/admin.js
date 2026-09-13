const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseCsv, toCsv } = require('../lib/csv');
const { encrypt, decrypt } = require('../lib/crypto');
const { CURRENT_SCHOOL_YEAR, computeStatus } = require('../lib/account');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

// enrollment_status is the same computed PENDING_PAYMENT/PARTIALLY_PAID/
// FULLY_PAID used on the Accounts page (see lib/account.js) — shown here
// instead of the raw `students.status` administrative flag, per the roster
// page's "what's their enrollment/payment standing" use case.
router.get('/students', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.student_id, s.lrn, s.name, s.date_of_birth, s.gender, s.class_id, s.status,
            c.grade_level, c.section,
            COALESCE(fi.total_assessed, 0) AS total_assessed, COALESCE(p.total_paid, 0) AS total_paid
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     LEFT JOIN (SELECT student_id, SUM(amount) AS total_assessed FROM fee_items WHERE school_year = $2 GROUP BY student_id) fi
       ON fi.student_id = s.student_id
     LEFT JOIN (SELECT student_id, SUM(amount) AS total_paid FROM payments WHERE school_year = $2 GROUP BY student_id) p
       ON p.student_id = s.student_id
     WHERE s.school_id = $1
     ORDER BY c.grade_level, c.section, s.name`,
    [req.user.school_id, CURRENT_SCHOOL_YEAR]
  );
  rows.forEach(r => {
    if (r.date_of_birth) r.date_of_birth = decrypt(r.date_of_birth);
    const { balance, status } = computeStatus(Number(r.total_assessed), Number(r.total_paid));
    r.balance = balance;
    r.enrollment_status = status;
    delete r.total_assessed;
    delete r.total_paid;
  });
  res.json(rows);
});

// Per-student grades, grouped by quarter on the frontend (GradesView) — the
// same shape as the student's own GET /student/grades, scoped to any student
// in this school rather than just the caller's own record. Used by the
// Student Detail modal (Students tab).
router.get('/students/:studentId/grades', async (req, res) => {
  const { rows: studentRows } = await pool.query(
    'SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2',
    [req.params.studentId, req.user.school_id]
  );
  if (!studentRows[0]) return res.status(404).json({ error: 'student not found' });
  const { rows } = await pool.query(
    `SELECT subject, grading_period, first_period_exam, second_period_exam, third_period_exam, formative_score, final_grade
     FROM grades WHERE student_id = $1 ORDER BY grading_period, subject`,
    [req.params.studentId]
  );
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
  const { rows: teachers } = await pool.query(
    `SELECT t.teacher_id, u.user_id, u.name, u.email, c.grade_level AS advises_grade, c.section AS advises_section
     FROM teachers t
     JOIN users u ON u.user_id = t.user_id
     LEFT JOIN classes c ON c.teacher_id = t.teacher_id
     WHERE t.school_id = $1
     ORDER BY u.name`,
    [req.user.school_id]
  );
  const { rows: assignments } = await pool.query(
    `SELECT ts.teacher_id, s.name AS subject, s.grade_level
     FROM teacher_subjects ts
     JOIN subjects s ON s.subject_id = ts.subject_id
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     WHERE t.school_id = $1`,
    [req.user.school_id]
  );
  teachers.forEach(t => {
    t.subjects = assignments
      .filter(a => a.teacher_id === t.teacher_id)
      .map(a => ({ subject: a.subject, grade_level: a.grade_level }));
  });
  res.json(teachers);
});

// Subject-teacher assignment (see the Subjects tab / admin/subjects) — each
// subject is its own row (one per grade+section instance, admin-creatable,
// unique code), and one subject can have more than one teacher, so
// assignment is keyed by subject_id rather than by teacher.
router.get('/subjects', async (req, res) => {
  const { rows: subjects } = await pool.query(
    `SELECT subject_id, grade_level, section, code, name, schedule_days, start_time, end_time, room
     FROM subjects WHERE school_id = $1 ORDER BY grade_level, section, name`,
    [req.user.school_id]
  );
  const { rows: assignments } = await pool.query(
    `SELECT ts.subject_id, ts.teacher_id, u.name AS teacher_name
     FROM teacher_subjects ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     JOIN users u ON u.user_id = t.user_id
     WHERE t.school_id = $1
     ORDER BY u.name`,
    [req.user.school_id]
  );
  const toSubjectJson = s => ({
    subject_id: s.subject_id,
    code: s.code,
    name: s.name,
    schedule: { days: s.schedule_days, start_time: s.start_time, end_time: s.end_time, room: s.room },
    teachers: assignments
      .filter(a => a.subject_id === s.subject_id)
      .map(a => ({ teacher_id: a.teacher_id, name: a.teacher_name })),
  });
  const grades = [];
  for (let grade = 1; grade <= 6; grade++) {
    const inGrade = subjects.filter(s => s.grade_level === grade);
    const sections = [...new Set(inGrade.map(s => s.section))].sort();
    grades.push({
      grade_level: grade,
      sections: sections.map(section => ({
        section,
        subjects: inGrade.filter(s => s.section === section).map(toSubjectJson),
      })),
    });
  }
  res.json(grades);
});

// Admin creates a new subject instance for a grade+section — its own unique
// code, its own mock schedule. Independent of curriculum.js's fixed SUBJECTS
// list (grade entry/enrollment display); adding one here does not make it
// gradeable in Teacher > Grades.
router.post('/subjects', async (req, res) => {
  const { grade_level, section, code, name, schedule_days, start_time, end_time, room } = req.body;
  const gradeLevel = Number(grade_level);
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 6) {
    return res.status(400).json({ error: 'grade level must be an integer 1-6' });
  }
  if (!section?.trim() || !code?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'section, code, and name are required' });
  }
  const subjectId = `SUBJ-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await pool.query(
      `INSERT INTO subjects (subject_id, school_id, grade_level, section, code, name, schedule_days, start_time, end_time, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [subjectId, req.user.school_id, gradeLevel, section.trim(), code.trim(), name.trim(), schedule_days || null, start_time || null, end_time || null, room || null]
    );
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `subject code "${code.trim()}" is already in use` });
    throw err;
  }
  res.status(201).json({ subject_id: subjectId, grade_level: gradeLevel, section: section.trim(), code: code.trim(), name: name.trim() });
});

// Two subject rows' schedules overlap if they share at least one day token
// (from the free-text `schedule_days`, e.g. "Mon/Wed/Fri") AND their time
// ranges intersect. Either side missing a schedule can't conflict (nothing
// to compare).
function schedulesOverlap(a, b) {
  if (!a.schedule_days || !a.start_time || !a.end_time) return false;
  if (!b.schedule_days || !b.start_time || !b.end_time) return false;
  const aDays = a.schedule_days.split('/').map(d => d.trim());
  const bDays = b.schedule_days.split('/').map(d => d.trim());
  if (!aDays.some(d => bDays.includes(d))) return false;
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

// A teacher can't be in two places at once — before assigning teacherId to
// subjectId, check every OTHER subject that teacher is already on for this
// school for a day/time overlap. Returns the conflicting subject row, or
// null if there's no conflict (including when subjectId itself has no
// schedule set yet).
async function findScheduleConflict(schoolId, teacherId, subjectId) {
  const { rows: subjRows } = await pool.query(
    'SELECT schedule_days, start_time, end_time FROM subjects WHERE subject_id = $1 AND school_id = $2',
    [subjectId, schoolId]
  );
  const target = subjRows[0];
  if (!target) return null;
  const { rows: others } = await pool.query(
    `SELECT s.subject_id, s.code, s.name, s.grade_level, s.section, s.schedule_days, s.start_time, s.end_time
     FROM teacher_subjects ts
     JOIN subjects s ON s.subject_id = ts.subject_id
     WHERE ts.teacher_id = $1 AND s.subject_id != $2 AND s.school_id = $3`,
    [teacherId, subjectId, schoolId]
  );
  return others.find(o => schedulesOverlap(target, o)) || null;
}

// Replaces the full teacher set for one subject — the admin UI always sends
// the complete checked set, so delete+reinsert in one transaction is simpler
// and just as correct as a diff. Every teacher in the requested set is
// checked for a schedule conflict against their OTHER subjects before
// anything is written — if any conflict, nothing is applied (all-or-nothing).
router.put('/subjects/:subjectId/teachers', async (req, res) => {
  const { teacher_ids } = req.body;
  if (!Array.isArray(teacher_ids)) {
    return res.status(400).json({ error: 'teacher_ids must be an array' });
  }
  const { rows: subjectRows } = await pool.query(
    'SELECT subject_id FROM subjects WHERE subject_id = $1 AND school_id = $2',
    [req.params.subjectId, req.user.school_id]
  );
  if (!subjectRows[0]) return res.status(404).json({ error: 'subject not found' });
  const { rows: valid } = await pool.query(
    'SELECT t.teacher_id, u.name FROM teachers t JOIN users u ON u.user_id = t.user_id WHERE t.school_id = $1 AND t.teacher_id = ANY($2)',
    [req.user.school_id, teacher_ids]
  );
  if (valid.length !== new Set(teacher_ids).size) {
    return res.status(400).json({ error: 'one or more teacher_ids not found' });
  }

  for (const teacherId of teacher_ids) {
    const conflict = await findScheduleConflict(req.user.school_id, teacherId, req.params.subjectId);
    if (conflict) {
      const teacherName = valid.find(t => t.teacher_id === teacherId)?.name || teacherId;
      return res.status(409).json({
        error: `${teacherName} already teaches ${conflict.name} (${conflict.code}, Grade ${conflict.grade_level} - ${conflict.section}) at an overlapping time.`,
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM teacher_subjects WHERE subject_id = $1', [req.params.subjectId]);
    for (const teacherId of teacher_ids) {
      await client.query('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2)', [teacherId, req.params.subjectId]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ subject_id: req.params.subjectId, teacher_ids });
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
