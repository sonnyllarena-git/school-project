require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const SCHOOL_ID = 'STM001';
const SUBJECTS = ['Filipino', 'English', 'Math', 'Science', 'Values Education'];
const GRADING_PERIOD = 'First Grading';

const TEACHERS = [
  { n: 1, name: 'Ms. Ana Gonzales', grade: 1 },
  { n: 2, name: 'Mr. Carlos Ramos', grade: 2 },
  { n: 3, name: 'Ms. Patricia Cruz', grade: 3 },
  { n: 4, name: 'Mr. Ramon Santos', grade: 4 },
  { n: 5, name: 'Ms. Lily Fernandez', grade: 5 },
  { n: 6, name: 'Mr. Victor Lopez', grade: 6 },
  { n: 7, name: 'Ms. Rosa Guinto', grade: null },
  { n: 8, name: 'Mr. Alfonso Reyes', grade: null },
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
    'TRUNCATE TABLE audit_logs, backups, grades, attendance, student_guardians, guardians, students, classes, teachers, users, schools RESTART IDENTITY CASCADE'
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
    classRows.push([`CLS${pad(t.grade, 3)}`, SCHOOL_ID, t.grade, 'A', `TCH-${pad(t.n, 3)}`, `${100 + t.grade * 10}`, '2025-2026']);
  }
  await bulkInsert(client, 'classes', ['class_id', 'school_id', 'grade_level', 'section', 'teacher_id', 'room', 'school_year'], classRows);

  const studentRows = [];
  const attendanceRows = [];
  const gradeRows = [];
  const schoolDays = [2, 3, 4, 5, 6, 9, 10, 11, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27]; // June 2025, weekdays, excl. Jun 12 holiday

  const studentUserRows = [];
  let studentSeq = 1;
  for (let grade = 1; grade <= 6; grade++) {
    const classId = `CLS${pad(grade, 3)}`;
    const teacherUserId = `USR-TCH-${pad(grade, 3)}`;
    for (let i = 0; i < 25; i++) {
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
      studentRows.push([studentId, lrn, SCHOOL_ID, classId, studentUserId, `${first} ${last}`, dob, isMale ? 'M' : 'F', 'Active']);

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

      studentSeq++;
    }
  }
  await bulkInsert(client, 'users', ['user_id', 'school_id', 'email', 'password_hash', 'role', 'name'], studentUserRows);
  await bulkInsert(client, 'students', ['student_id', 'lrn', 'school_id', 'class_id', 'user_id', 'name', 'date_of_birth', 'gender', 'status'], studentRows);
  await bulkInsert(client, 'attendance', ['attendance_id', 'class_id', 'student_id', 'date', 'status', 'time_in', 'notes', 'recorded_by'], attendanceRows);
  await bulkInsert(client, 'grades', ['grade_id', 'class_id', 'student_id', 'subject', 'grading_period', 'first_period_exam', 'second_period_exam', 'third_period_exam', 'formative_score', 'final_grade', 'recorded_by'], gradeRows);

  // Guardians: one guardian account per pair of students (siblings), matching MOCK_SCHOOL_DATA.md's ~1-per-2-3-students pattern.
  const guardianUserRows = [];
  const guardianRows = [];
  const linkRows = [];
  let guardianSeq = 1;
  for (let i = 0; i < studentRows.length; i += 2) {
    const userId = `USR-PAR-${pad(guardianSeq, 4)}`;
    const guardianId = `GRD-PAR-${pad(guardianSeq, 4)}`;
    const hash = await bcrypt.hash(`Parent@${guardianSeq}`, 10);
    const childSurname = studentRows[i][4].split(' ').pop();
    guardianUserRows.push([userId, SCHOOL_ID, `parent.${guardianSeq}@stmichaels.ph`, hash, 'PARENT', `Guardian of ${childSurname} family`]);
    guardianRows.push([guardianId, userId, `0917${pad(randInt(0, 9999999), 7)}`]);
    linkRows.push([studentRows[i][0], guardianId]);
    if (studentRows[i + 1]) linkRows.push([studentRows[i + 1][0], guardianId]);
    guardianSeq++;
  }
  await bulkInsert(client, 'users', ['user_id', 'school_id', 'email', 'password_hash', 'role', 'name'], guardianUserRows);
  await bulkInsert(client, 'guardians', ['guardian_id', 'user_id', 'phone'], guardianRows);
  await bulkInsert(client, 'student_guardians', ['student_id', 'guardian_id'], linkRows);

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM students) AS students,
      (SELECT COUNT(*) FROM teachers) AS teachers,
      (SELECT COUNT(*) FROM classes) AS classes,
      (SELECT COUNT(*) FROM attendance) AS attendance,
      (SELECT COUNT(*) FROM grades) AS grades,
      (SELECT COUNT(*) FROM guardians) AS guardians,
      (SELECT COUNT(*) FROM users) AS users
  `);
  console.log(counts.rows[0]);

  await client.end();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
