const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SENDER_ROLES = ['ADMIN', 'TEACHER', 'REGISTRAR'];

// Announcements only (no private 1:1 threads, no read/unread state — see
// the messages table comment in db/schema.sql for why). A student's inbox
// is everything addressed to ALL, to their own grade+section, or to them
// specifically; staff additionally see whatever they've personally sent,
// as a lightweight sent-history rather than a separate endpoint.
router.get('/', async (req, res) => {
  let gradeLevel = null;
  let section = null;
  let studentId = null;
  if (req.user.role === 'STUDENT') {
    const { rows } = await pool.query(
      `SELECT s.student_id, c.grade_level, c.section
       FROM students s LEFT JOIN classes c ON c.class_id = s.class_id
       WHERE s.user_id = $1`,
      [req.user.user_id]
    );
    if (rows[0]) {
      studentId = rows[0].student_id;
      gradeLevel = rows[0].grade_level;
      section = rows[0].section;
    }
  }

  const { rows } = await pool.query(
    `SELECT m.message_id, m.audience_type, m.audience_grade_level, m.audience_section,
            m.audience_student_id, m.subject, m.body, m.created_at,
            u.name AS sender_name, u.role AS sender_role
     FROM messages m
     JOIN users u ON u.user_id = m.sender_user_id
     WHERE m.school_id = $1
       AND (
         m.audience_type = 'ALL'
         OR m.sender_user_id = $2
         OR ($3::int IS NOT NULL AND m.audience_type = 'GRADE_SECTION' AND m.audience_grade_level = $3 AND m.audience_section = $4)
         OR ($5::text IS NOT NULL AND m.audience_type = 'STUDENT' AND m.audience_student_id = $5)
       )
     ORDER BY m.created_at DESC`,
    [req.user.school_id, req.user.user_id, gradeLevel, section, studentId]
  );
  res.json(rows);
});

router.post('/', requireRole(...SENDER_ROLES), async (req, res) => {
  const { audience_type, audience_grade_level, audience_section, audience_student_id, subject, body } = req.body;
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'subject and body are required' });
  }
  if (!['ALL', 'GRADE_SECTION', 'STUDENT'].includes(audience_type)) {
    return res.status(400).json({ error: "audience_type must be one of: ALL, GRADE_SECTION, STUDENT" });
  }
  if (audience_type === 'GRADE_SECTION' && (!audience_grade_level || !audience_section)) {
    return res.status(400).json({ error: 'audience_grade_level and audience_section are required for GRADE_SECTION' });
  }
  if (audience_type === 'STUDENT') {
    if (!audience_student_id) return res.status(400).json({ error: 'audience_student_id is required for STUDENT' });
    const { rows } = await pool.query(
      'SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2',
      [audience_student_id, req.user.school_id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'unknown audience_student_id' });
  }

  const messageId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO messages (message_id, school_id, sender_user_id, audience_type, audience_grade_level, audience_section, audience_student_id, subject, body)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      messageId, req.user.school_id, req.user.user_id, audience_type,
      audience_type === 'GRADE_SECTION' ? audience_grade_level : null,
      audience_type === 'GRADE_SECTION' ? audience_section : null,
      audience_type === 'STUDENT' ? audience_student_id : null,
      subject.trim(), body.trim(),
    ]
  );
  res.status(201).json({ message_id: messageId });
});

module.exports = router;
