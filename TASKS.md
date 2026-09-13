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

**Note:** Tasks F–N above are backend API only.

---

## Phase 1: Frontend (React + Vite)

Design language follows `References/dashboard reference.jpg` and `References/login reference.png`
(dark navy sidebar, card-based stats, data tables).

- [x] **Login page** — single form, redirects to the right dashboard per role after login
- [x] **Admin: Dashboard** — school info, attendance %, grade distribution (reports API)
- [x] **Admin: Teachers** — list + add teacher form
- [x] **Admin: Import Roster** — paste-CSV import UI
- [x] **Admin: Data Export** — authenticated CSV download per table
- [x] **Teacher: Attendance** — class + date picker, per-student status, save
- [x] **Teacher: Grades** — class + subject + grading period picker, per-student score entry
- [x] **Student: My Grades / My Attendance** — read-only, own record only
- [x] **Parent: My Children** — child picker, tabbed grades/attendance, scoped to linked children

Verify: manually exercised all 4 roles end-to-end in a real browser (login → role-correct
dashboard → each nav page → real data from the seeded DB), console clean, no failed requests.
Found and fixed one real bug this way (guardian display name), which a status-code-only check
would have missed — see LESSONS.md.

---

## Phase 2: Compliance & Resilience (CLAUDE.md §1 red flags not covered above)

- [x] **Task O: Field-Level Encryption (AES-256)**
  - Encrypt `students.date_of_birth` and `guardians.phone` at the application layer (Node `crypto`, `aes-256-gcm`)
  - Name/LRN/etc. stay plaintext — they're used for sort/search/joins; encrypting them needs deterministic
    encryption, a bigger design decision, deliberately not taken on here
  - Verify: raw DB value is ciphertext; app reads/exports show correct plaintext
  - Pass condition: matches CLAUDE.md §1.1 "encrypted at rest (AES-256)"

- [x] **Task P: Offline-First (Attendance & Grades)**
  - Service worker caches the app shell so the UI itself loads with no network
  - Teacher attendance/grade saves: on network failure, queue locally (localStorage) and sync automatically
    when back online; roster is cached locally after first successful load so it's available offline too
  - Verify: go offline mid-session, mark attendance, see it queued, go back online, see it sync
  - Pass condition: matches CLAUDE.md §1.4 (offline-first core features, sync on reconnect)
  - Note: conflict resolution (last-write-wins + timestamp) already exists at the DB layer via each
    table's `recorded_at = now()` upsert — no extra work needed there

- [x] **Task Q: Disaster Recovery — Backups & Status Page**
  - Backup script: dumps all tables to a timestamped JSON file, logs a row in `backups`, prunes files older
    than 30 days
  - Public `/status` endpoint (no auth) + a public status page showing current health and recent history
  - Verify: run backup script, confirm file + `backups` row; hit `/status` with no token, see history
  - Pass condition: matches CLAUDE.md §1.5 (daily backup, 30-day retention, public status page)
  - Note: DB failover replica / zero-downtime deploy are hosting-tier decisions (managed Postgres plan,
    host's deploy pipeline), not application code — flagged, not built here

- [x] **Task R: Right-to-Deletion**
  - `GET /admin/students` (roster list), `DELETE /admin/students/:studentId` (cascades attendance/grades/
    guardian links, audit-logged)
  - Admin UI: students list page with a delete action (confirm before deleting)
  - Verify: delete a student, confirm all related rows are gone and an audit_log entry exists
  - Pass condition: matches CLAUDE.md §1.1 "Right-to-deletion feature"

