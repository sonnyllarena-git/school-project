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

