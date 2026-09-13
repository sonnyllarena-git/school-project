-- DepEd School Portal — PostgreSQL Schema
-- Tables: schools, users, students, teachers, classes, guardians,
--         student_guardians, attendance, grades, audit_logs, backups
--
-- Re-runnable: drops and recreates everything. Fine for this bootstrap/demo
-- phase (seed.js always repopulates from scratch); revisit before real data
-- exists — this would then need real migrations instead of DROP + CREATE.
DROP TABLE IF EXISTS backups, audit_logs, grades, attendance, student_guardians,
  guardians, students, classes, teachers, users, schools CASCADE;

CREATE TABLE schools (
  school_id     TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  address       TEXT,
  deped_id      TEXT,
  phone         TEXT,
  email         TEXT,
  school_year   TEXT NOT NULL,
  principal     TEXT,
  region        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admins, registrars, teachers, students, and guardians all authenticate
-- through this table. Role-specific fields live in `teachers`/`students`/
-- `guardians`, joined 1:1 on user_id.
CREATE TABLE users (
  user_id       TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL REFERENCES schools(school_id),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN', 'REGISTRAR', 'TEACHER', 'PARENT', 'STUDENT')),
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teachers (
  teacher_id    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  school_id     TEXT NOT NULL REFERENCES schools(school_id)
);

CREATE TABLE classes (
  class_id      TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL REFERENCES schools(school_id),
  grade_level   INT NOT NULL,
  section       TEXT NOT NULL,
  teacher_id    TEXT REFERENCES teachers(teacher_id),
  room          TEXT,
  school_year   TEXT NOT NULL
);

-- user_id is nullable: a school may not issue portal logins to its
-- youngest students, but one is required to use the Student view (Task K).
-- date_of_birth is TEXT, not DATE: it stores AES-256-GCM ciphertext
-- (backend/src/lib/crypto.js), never queried/sorted on, only encrypted on
-- write and decrypted on read by the app.
CREATE TABLE students (
  student_id    TEXT PRIMARY KEY,
  lrn           TEXT NOT NULL UNIQUE,
  school_id     TEXT NOT NULL REFERENCES schools(school_id),
  class_id      TEXT REFERENCES classes(class_id),
  user_id       TEXT UNIQUE REFERENCES users(user_id),
  name          TEXT NOT NULL,
  date_of_birth TEXT,
  gender        TEXT,
  status        TEXT NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parent/guardian portal accounts (role='PARENT' in `users`), linked to
-- one or more students via `student_guardians` (siblings share a guardian).
CREATE TABLE guardians (
  guardian_id   TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  phone         TEXT
);

CREATE TABLE student_guardians (
  student_id    TEXT NOT NULL REFERENCES students(student_id),
  guardian_id   TEXT NOT NULL REFERENCES guardians(guardian_id),
  PRIMARY KEY (student_id, guardian_id)
);

CREATE TABLE attendance (
  attendance_id TEXT PRIMARY KEY,
  class_id      TEXT NOT NULL REFERENCES classes(class_id),
  student_id    TEXT NOT NULL REFERENCES students(student_id),
  date          DATE NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'TARDY')),
  time_in       TIME,
  notes         TEXT,
  recorded_by   TEXT NOT NULL REFERENCES users(user_id),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id, date)
);

-- `subject` kept as free text (not a normalized table) — matches
-- MOCK_SCHOOL_DATA.md's sample records; no separate subjects list exists yet.
CREATE TABLE grades (
  grade_id            TEXT PRIMARY KEY,
  class_id            TEXT NOT NULL REFERENCES classes(class_id),
  student_id          TEXT NOT NULL REFERENCES students(student_id),
  subject             TEXT NOT NULL,
  grading_period      TEXT NOT NULL,
  first_period_exam   NUMERIC(5,2),
  second_period_exam  NUMERIC(5,2),
  third_period_exam   NUMERIC(5,2),
  formative_score     NUMERIC(5,2),
  final_grade         NUMERIC(5,2),
  recorded_by         TEXT NOT NULL REFERENCES users(user_id),
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id, subject, grading_period)
);

CREATE TABLE audit_logs (
  audit_id       TEXT PRIMARY KEY,
  school_id      TEXT NOT NULL REFERENCES schools(school_id),
  user_id        TEXT NOT NULL REFERENCES users(user_id),
  action         TEXT NOT NULL,
  table_affected TEXT NOT NULL,
  record_count   INT,
  ip_address     TEXT,
  status         TEXT NOT NULL,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE backups (
  backup_id        TEXT PRIMARY KEY,
  school_id        TEXT NOT NULL REFERENCES schools(school_id),
  backup_date      DATE NOT NULL,
  backup_time      TIME NOT NULL,
  tables_backed_up TEXT[] NOT NULL,
  total_records    INT,
  backup_size_mb   NUMERIC(10,2),
  backup_location  TEXT,
  status           TEXT NOT NULL,
  retention_days   INT NOT NULL DEFAULT 30
);
