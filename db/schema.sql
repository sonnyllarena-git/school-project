-- DepEd School Portal — PostgreSQL Schema
-- Tables: schools, users, students, teachers, classes, attendance, grades,
--         fee_items, payments, enrollments, audit_logs, backups
--
-- No Parent role/tables: the student login is the shared family login
-- (deliberate — see LESSONS.md).
--
-- Re-runnable: drops and recreates everything. Fine for this bootstrap/demo
-- phase (seed.js always repopulates from scratch); revisit before real data
-- exists — this would then need real migrations instead of DROP + CREATE.
DROP TABLE IF EXISTS backups, audit_logs, enrollments, payments, fee_items, grades,
  attendance, students, classes, teacher_subjects, subjects, teachers, users, schools,
  student_guardians, guardians CASCADE; -- one-time cleanup of retired Parent-role tables

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

-- Admins, registrars, teachers, and students all authenticate through this
-- table. Role-specific fields live in `teachers`/`students`, joined 1:1 on
-- user_id. No PARENT role — the student login is the shared family login.
CREATE TABLE users (
  user_id       TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL REFERENCES schools(school_id),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT')),
  name          TEXT NOT NULL,
  -- Stored preference only — no email/SMS sending is wired up yet (no
  -- provider integration). See LESSONS.md.
  notify_email  BOOLEAN NOT NULL DEFAULT true,
  notify_sms    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teachers (
  teacher_id    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  school_id     TEXT NOT NULL REFERENCES schools(school_id)
);

-- Admin-managed subject catalog, one row per (grade, section, subject)
-- instance — not a fixed list. Each row is its own thing with its own unique
-- code (e.g. "MATH1A" for Grade 1 Section A Math is a different row from
-- "MATH1B" for Section B, even though the subject name is the same), and its
-- own mock class schedule — see the Subjects tab (admin/subjects). `code` is
-- globally unique per school, which also guarantees no two subjects within
-- the same grade+section share a code. Decoupled from `grades.subject` (free
-- text, used by teacher grade entry) and curriculum.js's SUBJECTS list (used
-- for enrollment/grade-entry display) — this table is about
-- scheduling/staffing, not academic scoring.
CREATE TABLE subjects (
  subject_id    TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL REFERENCES schools(school_id),
  grade_level   INT NOT NULL,
  section       TEXT NOT NULL,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  schedule_days TEXT,    -- mock schedule, free text e.g. "Mon/Wed/Fri"
  start_time    TIME,
  end_time      TIME,
  room          TEXT,
  UNIQUE (school_id, code)
);

-- Which subjects (subject rows, i.e. grade-specific instances above) a
-- teacher is assigned to teach — independent of class advisory
-- (classes.teacher_id). One subject can have more than one teacher (e.g. a
-- floating specialist co-teaching alongside the adviser).
CREATE TABLE teacher_subjects (
  teacher_id    TEXT NOT NULL REFERENCES teachers(teacher_id),
  subject_id    TEXT NOT NULL REFERENCES subjects(subject_id),
  PRIMARY KEY (teacher_id, subject_id)
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

-- Statement of Account: itemized charges per student per school year.
-- Lump sum per year (not per grading period) — see LESSONS.md for why.
CREATE TABLE fee_items (
  fee_item_id   TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES students(student_id),
  school_year   TEXT NOT NULL,
  fee_type      TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  description   TEXT
);

-- Manual payment ledger (no payment gateway — admin/registrar records what
-- was actually received). Enrollment status is always computed from
-- SUM(payments.amount) vs SUM(fee_items.amount), never stored/overridden.
CREATE TABLE payments (
  payment_id    TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES students(student_id),
  school_year   TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  payment_date  DATE NOT NULL,
  method        TEXT NOT NULL CHECK (method IN ('CASH', 'GCASH', 'BANK_TRANSFER')),
  reference_no  TEXT,
  recorded_by   TEXT NOT NULL REFERENCES users(user_id),
  notes         TEXT,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-student, per-school-year re-enrollment pipeline (promotion to the next
-- grade level). Parent approval is deliberately NOT a tracked stage — it
-- happens offline, on the printed copy, between PRINTED and the payment
-- that's recorded in `payments` (see LESSONS.md). CERTIFICATE_ISSUED is the
-- moment a student's `class_id` actually moves to the new grade/section.
CREATE TABLE enrollments (
  enrollment_id         TEXT PRIMARY KEY,
  student_id            TEXT NOT NULL REFERENCES students(student_id),
  school_year           TEXT NOT NULL,
  grade_level           INT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('VERIFIED', 'ASSESSED', 'PRINTED', 'CERTIFICATE_ISSUED')) DEFAULT 'VERIFIED',
  verified_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessed_at            TIMESTAMPTZ,
  printed_at             TIMESTAMPTZ,
  certificate_issued_at  TIMESTAMPTZ,
  recorded_by            TEXT NOT NULL REFERENCES users(user_id),
  UNIQUE (student_id, school_year)
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
