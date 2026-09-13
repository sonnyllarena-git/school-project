require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { encrypt } = require('../src/lib/crypto');
const { SUBJECTS, SUBJECT_CODES, feeTemplateForGrade } = require('../src/lib/curriculum');

const SCHOOL_ID = 'STM001';
const SCHOOL_YEAR = '2025-2026';
const GRADING_PERIOD = 'First Grading';
const PAYMENT_METHODS = ['CASH', 'GCASH', 'BANK_TRANSFER'];

// n:1-8 are unchanged from before sections existed (keeps demo logins
// teacher.1@ through teacher.8@ stable). n:9-14 are the new Section B
// advisers, added rather than renumbering anything.
const TEACHERS = [
  { n: 1, name: 'Ms. Ana Gonzales', grade: 1, section: 'A' },
  { n: 2, name: 'Mr. Carlos Ramos', grade: 2, section: 'A' },
  { n: 3, name: 'Ms. Patricia Cruz', grade: 3, section: 'A' },
  { n: 4, name: 'Mr. Ramon Santos', grade: 4, section: 'A' },
  { n: 5, name: 'Ms. Lily Fernandez', grade: 5, section: 'A' },
  { n: 6, name: 'Mr. Victor Lopez', grade: 6, section: 'A' },
  { n: 7, name: 'Ms. Rosa Guinto', grade: null, section: null },
  { n: 8, name: 'Mr. Alfonso Reyes', grade: null, section: null },
  { n: 9, name: 'Ms. Teresa Mercado', grade: 1, section: 'B' },
  { n: 10, name: 'Mr. Eduardo Bautista', grade: 2, section: 'B' },
  { n: 11, name: 'Ms. Carmela Dato', grade: 3, section: 'B' },
  { n: 12, name: 'Mr. Francisco Ignacio', grade: 4, section: 'B' },
  { n: 13, name: 'Ms. Beatriz Torres', grade: 5, section: 'B' },
  { n: 14, name: 'Mr. Gabriel Navarro', grade: 6, section: 'B' },
];

const MALE_FIRST = ['Miguel', 'Luis', 'Robert', 'Jose', 'Juan', 'Antonio', 'Manuel', 'Francisco', 'Ricardo', 'Eduardo', 'Rafael', 'Gabriel'];
const FEMALE_FIRST = ['Maria', 'Angela', 'Carmela', 'Isabel', 'Teresa', 'Josefina', 'Rosario', 'Corazon', 'Beatriz', 'Consuelo', 'Remedios', 'Victoria'];
const SURNAMES = ['Aquino', 'Bautista', 'Cantos', 'Dato', 'Esguerra', 'Fernandez', 'Guinto', 'Hernandez', 'Ignacio', 'Jimenez', 'Lopez', 'Mercado', 'Navarro', 'Ocampo', 'Pascual', 'Quinto', 'Reyes', 'Santos', 'Torres', 'Uy'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

async function bulkInsert(client, table, columns, rows, chunkSize = 300) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const placeholders = chunk.map((row, r) => {
      const base = r * columns.length;
      values.push(...row);
      return `(${columns.map((_, c) => `$${base + c + 1}`).join(', ')})`;
    });
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
    await client.query(sql, values);
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(
    'TRUNCATE TABLE audit_logs, backups, enrollments, payments, fee_items, grades, attendance, students, classes, teacher_subjects, subjects, teachers, users, schools RESTART IDENTITY CASCADE'
  );

  await client.query(
    `INSERT INTO schools (school_id, name, address, deped_id, phone, email, school_year, principal, region)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [SCHOOL_ID, "St. Michael's Academy", '123 Marañon Street, Santo Tomás, Batangas 4211', '123456789',
      '(043) 740-1234', 'info@stmichaels.ph', '2025-2026', 'Dr. Maria Santos', 'CALABARZON']
  );

  const adminHash = await bcrypt.hash('Admin@2025', 10);
  const registrarHash = await bcrypt.hash('Registrar@2025', 10);
  await bulkInsert(client, 'users', ['user_id', 'school_id', 'email', 'password_hash', 'role', 'name'], [
    ['USR-ADMIN-001', SCHOOL_ID, 'admin@stmichaels.ph', adminHash, 'ADMIN', 'Maria Rodriguez'],
    ['USR-REG-001', SCHOOL_ID, 'registrar@stmichaels.ph', registrarHash, 'REGISTRAR', 'John Dela Cruz'],
  ]);

  const teacherUserRows = [];
  const teacherRows = [];
  for (const t of TEACHERS) {
    const userId = `USR-TCH-${pad(t.n, 3)}`;
    const hash = await bcrypt.hash(`Teacher@${t.n}`, 10);
    teacherUserRows.push([userId, SCHOOL_ID, `teacher.${t.n}@stmichaels.ph`, hash, 'TEACHER', t.name]);
    teacherRows.push([`TCH-${pad(t.n, 3)}`, userId, SCHOOL_ID]);
  }
  await bulkInsert(client, 'users', ['user_id', 'school_id', 'email', 'password_hash', 'role', 'name'], teacherUserRows);
  await bulkInsert(client, 'teachers', ['teacher_id', 'user_id', 'school_id'], teacherRows);

  const classRows = [];
  for (const t of TEACHERS) {
    if (t.grade === null) continue;
    const classId = `CLS${pad(t.grade, 3)}${t.section}`;
    const room = `${100 + t.grade * 10 + (t.section === 'B' ? 1 : 0)}`;
    classRows.push([classId, SCHOOL_ID, t.grade, t.section, `TCH-${pad(t.n, 3)}`, room, '2025-2026']);
  }
  await bulkInsert(client, 'classes', ['class_id', 'school_id', 'grade_level', 'section', 'teacher_id', 'room', 'school_year'], classRows);

  // One subject "instance" per (grade, section, subject) — each gets its own
  // unique code (e.g. MATH1A for Grade 1 Section A Math, MATH1B for Section
  // B) and its own mock class schedule. Schedule pattern is fixed per subject
  // name (same time-of-day story across grades/sections, different room per
  // section) — illustrative only, not sourced from any real timetable. Both
  // sections of a grade sharing the same time slot per subject is realistic
  // (parallel sections really do run at the same time, in different rooms
  // with different teachers) — it's only a real conflict if the *same*
  // teacher were assigned to that slot twice, which the co-teaching
  // assignments below deliberately avoid.
  const SUBJECT_SCHEDULE = {
    Filipino: { days: 'Mon/Wed/Fri', start_time: '08:00', end_time: '09:00' },
    English: { days: 'Tue/Thu', start_time: '08:00', end_time: '09:30' },
    Math: { days: 'Mon/Wed/Fri', start_time: '09:00', end_time: '10:00' },
    Science: { days: 'Tue/Thu', start_time: '09:30', end_time: '10:30' },
    'Values Education': { days: 'Mon/Wed/Fri', start_time: '10:00', end_time: '10:30' },
  };
  const SECTIONS = ['A', 'B'];
  const subjectRows = [];
  const subjectIdByGradeSectionSubject = {};
  for (let grade = 1; grade <= 6; grade++) {
    for (const section of SECTIONS) {
      const room = `${100 + grade * 10 + (section === 'B' ? 1 : 0)}`;
      for (const subject of SUBJECTS) {
        const subjectId = `SUBJ-${grade}${section}-${SUBJECT_CODES[subject]}`;
        const sched = SUBJECT_SCHEDULE[subject];
        subjectRows.push([
          subjectId, SCHOOL_ID, grade, section, `${SUBJECT_CODES[subject]}${grade}${section}`, subject,
          sched.days, sched.start_time, sched.end_time, room,
        ]);
        subjectIdByGradeSectionSubject[`${grade}${section}|${subject}`] = subjectId;
      }
    }
  }
  await bulkInsert(client, 'subjects',
    ['subject_id', 'school_id', 'grade_level', 'section', 'code', 'name', 'schedule_days', 'start_time', 'end_time', 'room'],
    subjectRows);

  // Section advisers already teach every subject to their own class (see
  // gradeRows below) — assign them all 5 subject instances for their own
  // (grade, section). The two floating teachers (no class, t.grade === null)
  // are additionally assigned as a second teacher on ONE subject each, in
  // Grade 4 Section A only — a real "more than one teacher per subject" case
  // for the Subjects tab to demo. Deliberately not spread across grades 4-6:
  // every grade uses the SAME fixed time-of-day per subject name (see
  // SUBJECT_SCHEDULE above), so a single teacher co-teaching "Science" in
  // both 4A and 5A would be double-booked at the exact same time — exactly
  // what PUT /admin/subjects/:id/teachers now rejects. Real schools stagger
  // grades' periods across the day so a specialist can rotate between them;
  // this mock data doesn't model that yet (see LESSONS.md).
  const teacherSubjectRows = [];
  for (const t of TEACHERS) {
    if (t.grade === null) continue;
    for (const subject of SUBJECTS) {
      teacherSubjectRows.push([`TCH-${pad(t.n, 3)}`, subjectIdByGradeSectionSubject[`${t.grade}${t.section}|${subject}`]]);
    }
  }
  teacherSubjectRows.push(['TCH-007', subjectIdByGradeSectionSubject['4A|Values Education']]); // Ms. Rosa Guinto, co-teaching
  teacherSubjectRows.push(['TCH-008', subjectIdByGradeSectionSubject['4A|Science']]); // Mr. Alfonso Reyes, co-teaching
  await bulkInsert(client, 'teacher_subjects', ['teacher_id', 'subject_id'], teacherSubjectRows);

  const studentRows = [];
  const attendanceRows = [];
  const gradeRows = [];
  const feeItemRows = [];
  const paymentRows = [];
  const schoolDays = [2, 3, 4, 5, 6, 9, 10, 11, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27]; // June 2025, weekdays, excl. Jun 12 holiday

  const studentUserRows = [];
  let studentSeq = 1;
  for (let grade = 1; grade <= 6; grade++) {
    // 25 students per grade split 13/12 across the two sections — same flat
    // LRN/student_id sequence as before (STU-000001..STU-000150), just now
    // attached to a specific section's class/adviser instead of one shared
    // per-grade class.
    for (let i = 0; i < 25; i++) {
      const section = i < 13 ? 'A' : 'B';
      const sectionTeacher = TEACHERS.find(t => t.grade === grade && t.section === section);
      const classId = `CLS${pad(grade, 3)}${section}`;
      const teacherUserId = `USR-TCH-${pad(sectionTeacher.n, 3)}`;
      const lrn = `123${pad(studentSeq, 3)}`;
      const studentId = `STU-${pad(studentSeq, 6)}`;
      const studentUserId = `USR-STU-${pad(studentSeq, 6)}`;
      const isMale = studentSeq % 2 === 0;
      const first = isMale ? MALE_FIRST[studentSeq % MALE_FIRST.length] : FEMALE_FIRST[studentSeq % FEMALE_FIRST.length];
      const last = SURNAMES[(studentSeq * 7) % SURNAMES.length];
      const birthYear = 2025 - (5 + grade);
      const dob = `${birthYear}-${pad(randInt(1, 12), 2)}-${pad(randInt(1, 28), 2)}`;

      const studentHash = await bcrypt.hash(`Student@${lrn}`, 10);
      studentUserRows.push([studentUserId, SCHOOL_ID, `student.${lrn}@stmichaels.ph`, studentHash, 'STUDENT', `${first} ${last}`]);
      studentRows.push([studentId, lrn, SCHOOL_ID, classId, studentUserId, `${first} ${last}`, encrypt(dob), isMale ? 'M' : 'F', 'Active']);

      for (const day of schoolDays) {
        const roll = Math.random();
        const status = roll < 0.88 ? 'PRESENT' : roll < 0.96 ? 'ABSENT' : 'TARDY';
        const date = `2025-06-${pad(day, 2)}`;
        attendanceRows.push([
          `ATT-${studentId}-${date}`, classId, studentId, date, status,
          status === 'ABSENT' ? null : '07:45:00', '', teacherUserId,
        ]);
      }

      for (const subject of SUBJECTS) {
        const base = randInt(70, 98);
        const p1 = base + randInt(-3, 3);
        const p2 = base + randInt(-3, 3);
        const p3 = base + randInt(-3, 3);
        const formative = base + randInt(-2, 4);
        const final = Math.round(((p1 + p2 + p3) / 3 * 0.7 + formative * 0.3) * 100) / 100;
        gradeRows.push([
          `GRD-${studentId}-${subject.replace(/\s+/g, '')}`, classId, studentId, subject, GRADING_PERIOD,
          p1, p2, p3, formative, final, teacherUserId,
        ]);
      }

      const template = feeTemplateForGrade(grade);
      let totalAssessed = 0;
      template.forEach((item, idx) => {
        feeItemRows.push([`FEE-${studentId}-${idx}`, studentId, SCHOOL_YEAR, item.fee_type, item.amount, null]);
        totalAssessed += item.amount;
      });

      const paymentRoll = Math.random();
      if (paymentRoll >= 0.34) { // ~2/3 have paid something; the rest are left pending
        const isFullyPaid = paymentRoll >= 0.67;
        const amount = isFullyPaid ? totalAssessed : Math.round(totalAssessed * (0.2 + Math.random() * 0.5));
        const method = PAYMENT_METHODS[randInt(0, PAYMENT_METHODS.length - 1)];
        const referenceNo = method === 'CASH' ? null : `REF-${randInt(100000, 999999)}`;
        const paymentDate = `2025-06-${pad(randInt(2, 27), 2)}`;
        paymentRows.push([
          `PAY-${studentId}-1`, studentId, SCHOOL_YEAR, amount, paymentDate, method, referenceNo,
          'USR-REG-001', isFullyPaid ? 'Full payment' : 'Partial payment',
        ]);
      }

      studentSeq++;
    }
  }
  await bulkInsert(client, 'users', ['user_id', 'school_id', 'email', 'password_hash', 'role', 'name'], studentUserRows);
  await bulkInsert(client, 'students', ['student_id', 'lrn', 'school_id', 'class_id', 'user_id', 'name', 'date_of_birth', 'gender', 'status'], studentRows);
  await bulkInsert(client, 'attendance', ['attendance_id', 'class_id', 'student_id', 'date', 'status', 'time_in', 'notes', 'recorded_by'], attendanceRows);
  await bulkInsert(client, 'grades', ['grade_id', 'class_id', 'student_id', 'subject', 'grading_period', 'first_period_exam', 'second_period_exam', 'third_period_exam', 'formative_score', 'final_grade', 'recorded_by'], gradeRows);
  await bulkInsert(client, 'fee_items', ['fee_item_id', 'student_id', 'school_year', 'fee_type', 'amount', 'description'], feeItemRows);
  await bulkInsert(client, 'payments', ['payment_id', 'student_id', 'school_year', 'amount', 'payment_date', 'method', 'reference_no', 'recorded_by', 'notes'], paymentRows);

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM students) AS students,
      (SELECT COUNT(*) FROM teachers) AS teachers,
      (SELECT COUNT(*) FROM classes) AS classes,
      (SELECT COUNT(*) FROM attendance) AS attendance,
      (SELECT COUNT(*) FROM grades) AS grades,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM fee_items) AS fee_items,
      (SELECT COUNT(*) FROM payments) AS payments
  `);
  console.log(counts.rows[0]);

  await client.end();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
