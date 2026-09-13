# DepEd School Portal — Task List

**Phase:** Bootstrap (0)
**Status:** COMPLETE — Phase 1 (Core Features) can begin

---

## Phase 0: Bootstrap (Weeks 1–2)

- [x] **Task A: Project Structure & Dependencies**
  - Create Node + Express + React project structure
  - Install: express, pg (postgres client), bcryptjs, jsonwebtoken, dotenv, cors
  - Verify: `npm run dev` starts without errors
  - Pass condition: Dev server runs on localhost:3000, no errors in console

- [x] **Task B: Database Schema & Migrations**
  - Create PostgreSQL schema (schools, users, students, teachers, classes, attendance, grades, audit_logs, backups)
  - Write migration scripts (Schema file in `/db/schema.sql`)
  - Verify: All tables created, `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'` returns 9+ tables
  - Pass condition: Can seed mock data without foreign key errors

- [x] **Task C: Mock School Data Seed**
  - Create seed script for St. Michael's Academy (MOCK_SCHOOL_DATA.md as source)
  - Seed: 1 school, 1 admin, 1 registrar, 8 teachers, 150 students, 6 classes, 1 month of attendance
  - Verify: `SELECT COUNT(*) FROM students` = 150, `SELECT COUNT(*) FROM teachers` = 8
  - Pass condition: Seed runs idempotently (can run multiple times without duplicates)

- [x] **Task D: Auth & User Login (Backend)**
  - Create `/auth/login` endpoint (email + password, returns JWT)
  - Implement bcrypt hashing for passwords
  - Create audit log entry on every login
  - Verify: Login with mock teacher account returns JWT token
  - Pass condition: Token decrypts correctly, contains user_id + role

- [x] **Task E: Data Privacy Baseline**
  - Add `.env` template (encryption keys, database URL, hosting region)
  - Block user data queries in code (add comments: "// NEVER log student names, IDs, grades")
  - Create AUDIT_LOGS table, write to it on all data access
  - Verify: Check AUDIT_LOGS table has entries (query_type, user_id, table_accessed, timestamp)
  - Pass condition: No student data in application logs or console output

---

**Gate Flip:**
When all Phase 0 tasks are ✅, flip `BOOTSTRAP: INCOMPLETE` → `BOOTSTRAP: COMPLETE` in CLAUDE.md

Then Phase 1 (Features) can begin.

---

## Phase 1: Core Features (Backend API first, matching CLAUDE.md §3 pass conditions)

- [x] **Task F: Auth Middleware & Role Guards**
  - JWT verification middleware (reads `Authorization: Bearer <token>`, attaches `req.user`)
  - Role-guard helper (e.g. `requireRole('ADMIN')`) for protected routes
  - Verify: request without token → 401; token with wrong role on a role-guarded route → 403
  - Pass condition: valid token + correct role reaches the route handler

- [x] **Task G: Admin — School Info & Teacher Accounts**
  - `GET/PATCH /admin/school` (school info)
  - `GET/POST /admin/teachers` (list, create teacher account + user login)
  - Verify: admin token can list/create; teacher/parent tokens get 403
  - Pass condition: matches CLAUDE.md §3 "Admin can create school, add teachers"

- [x] **Task H: Admin — Student Roster CSV Import**
  - `POST /admin/students/import` (CSV body → parsed, validated, inserted/upserted students)
  - Verify: sample CSV import creates expected row count, re-import doesn't duplicate
  - Pass condition: matches CLAUDE.md §3 "Admin can ... import student CSV"

- [x] **Task I: Teacher — Daily Attendance Marking**
  - `POST /teacher/classes/:classId/attendance` (date + per-student status), `GET` same
  - Verify: teacher token marks attendance for their own class for 1 day, no errors; other teachers' classes rejected (403/404)
  - Pass condition: matches CLAUDE.md §3 "Teacher can mark attendance for 1 class for 1 day without errors"

- [x] **Task J: Teacher — Grade Entry**
  - `POST /teacher/classes/:classId/grades` (per-student, per-subject, grading period)
  - Verify: entry succeeds; same class/subject/period is update-not-duplicate (matches schema's UNIQUE constraint)
  - Pass condition: grade is then visible via Task K's student endpoint

- [x] **Task K: Student View — My Grades & Attendance (read-only)**
  - `GET /me/grades`, `GET /me/attendance` (scoped to the logged-in student's own `student_id`)
  - Verify: student token sees own records; cannot query another student's ID
  - Pass condition: matches CLAUDE.md §3 "Grades entered by teacher appear in student view"

- [x] **Task L: Parent View — Child's Performance (read-only)**
  - `GET /me/children`, `GET /me/children/:studentId/grades`, `GET /me/children/:studentId/attendance`
  - Verify: parent token sees only linked children's data; requesting an unlinked student_id → 403/404
  - Pass condition: matches CLAUDE.md §3 "Parent can view child's grades (correct filtering, no access to other students)"

- [x] **Task M: Admin — School Reports**
  - `GET /admin/reports/attendance` (% present per class/school), `GET /admin/reports/grades` (distribution)
  - Verify: numbers match manual `SELECT` aggregates against seeded data
  - Pass condition: matches MVP feature 6

- [x] **Task N: Admin — Data Export**
  - `GET /admin/export` (CSV of students/teachers/attendance/grades, full or filtered)
  - Verify: exported CSV row counts match DB counts
  - Pass condition: matches MVP feature 7 / red-flag §1.3 (vendor lock-in prevention)

**Note:** these tasks build the backend API only. Frontend (React) screens per role are a
separate, larger body of work — flagged for a scoping conversation once the API is solid,
rather than assumed in scope here.

