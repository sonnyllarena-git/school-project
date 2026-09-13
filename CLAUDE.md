# DepEd School Portal — Project Context & Rules

**BOOTSTRAP: COMPLETE**

---

## §0 Project Summary

**What:** School management system for small Philippine schools (100–800 students).
- Role-based portal: Admin, Teacher, Student, Parent
- DepEd-compliant (NPC data privacy, no vendor lock-in, offline-capable, disaster recovery)
- MVP scope: Attendance, grades, roster, messaging, reports, data export

**Stack (to be confirmed):** Node.js + Express, React, PostgreSQL, JWT auth

**Mock School:** St. Michael's Academy, 150 students, grades 1–6, 8 teachers

**Timeline:** 9 weeks to MVP

---

## §1 Red Flags (Critical Constraints)

### 1. Data Privacy & Security
- ✅ All student data encrypted at rest (AES-256) and in transit (HTTPS)
- ✅ Data residency: Philippines territory only
- ✅ Passwords hashed with bcrypt + salt
- ✅ Audit logs for all data access (who, what, when)
- ✅ Right-to-deletion feature: schools can permanently remove student records

### 2. Compliance & Legal (NPC/DepEd)
- ✅ Privacy Policy embedded in app (footer link, no login required)
- ✅ Terms of Service: "School retains 100% data ownership"
- ✅ No automatic recurring charges without explicit consent
- ✅ Cannot sell or share student data with third parties
- ✅ Code blocks analytics tracking on student-sensitive fields

### 3. Vendor Lock-In Prevention
- ✅ One-click data export (CSV/JSON) for all records
- ✅ Export by date range, by class, or full dataset
- ✅ Detailed data format documentation (no proprietary encryption on exports)
- ✅ Migration guide for schools switching platforms

### 4. Offline-First & Reliability
- ✅ Core features work without internet (attendance, grades, roster)
- ✅ Service workers cache school data locally
- ✅ Offline edits sync when connection returns
- ✅ Conflict resolution: if two users edit same record, last-write-wins with timestamp log
- ✅ Daily automated backup (separate from user-initiated backup)
- ✅ Backup retention: 30 days minimum

### 5. Disaster Recovery
- ✅ Zero-downtime deployment (no single point of failure)
- ✅ Database failover replica (or managed service with auto-failover)
- ✅ RTO: 1 hour max
- ✅ RPO: 15 minutes max
- ✅ Public status page (show uptime)

### 6. Terms of Service (DepEd-Specific)
- ✅ "School data is YOUR data. We provide the service."
- ✅ SLA: 99.5% uptime (exclude scheduled maintenance windows)
- ✅ Data retention: minimum 3 years after school year ends
- ✅ Exit clause: "If service shuts down, data handed to school"
- ✅ No suspension without notice

---

## §2 MVP Features (Priority Order)

1. Admin onboarding (school info, teacher accounts, student roster import)
2. Teacher: Daily attendance marking per class
3. Teacher: Grade entry (marks per term)
4. Student view: My grades, my attendance (read-only)
5. Parent view: Child's performance (read-only)
6. Admin: School reports (attendance %, grade distribution)
7. Admin: Data export (CSV of all records)

---

## §3 Development & Verification

### Stack Decision (SETUP:FILL — To Be Confirmed)
- Backend: Node.js + Express ✅
- Database: PostgreSQL ✅
- Frontend: React ✅
- Auth: JWT + optional Azure AD ✅
- Hosting: DigitalOcean (data-local) ✅
- Encryption: bcrypt, TweetNaCl.js ✅

### How to Know It Works (Pass Conditions per Task)
- Phase 0 (Bootstrap):
  - [ ] Project structure created, dependencies installed, dev server runs without errors
  - [ ] Mock school data seeded (150 students, 8 teachers, 6 classes)
  - [ ] Database schema created (all tables present, no errors on `SELECT COUNT(*)` from each)

- Phase 1 (Core Features):
  - [ ] Admin can create school, add teachers, import student CSV
  - [ ] Teacher can mark attendance for 1 class for 1 day without errors
  - [ ] Grades entered by teacher appear in student view
  - [ ] Parent can view child's grades (correct filtering, no access to other students)

- Phase 2 (Security & Compliance):
  - [ ] All student data export works (CSV produced, matches database counts)
  - [ ] Offline mode: attendance marked offline, syncs correctly when online
  - [ ] Daily backup runs, can restore from 30-day-old backup
  - [ ] Privacy Policy + ToS pass lawyer review checklist

---

## §4 Rules While Bootstrapping

**§4.1 Bootstrap Infrastructure Only**
While `BOOTSTRAP: INCOMPLETE`, Claude can:
- Create project structure (backend/, frontend/, db/, docs/ folders)
- Create .env.example template (no secrets, just keys)
- Initialize package.json and package-lock.json
- **Install dependencies** (`npm install` — Task A infrastructure, not feature coding)
- Create database schema file (/db/schema.sql)
- Seed mock data (MOCK_SCHOOL_DATA.md → database)
- Read existing docs and code
- Generate or update TASKS.md, LESSONS.md
- **NOT:** Edit business logic, build API endpoints, build React components, or code beyond Task A–E scope

**§4.2 One Task Per Turn**
Type `next` each turn. Claude reads `TASKS.md`, finds the next unchecked `[ ]` task, executes it, reports in 5 lines, then stops.

**§4.3 3-Strike Rule (§4.7)**
If a verify step fails 3 times, Claude logs the error to `LESSONS.md` under `## Open Blockers` and asks you for help. No invention.

**§4.4 Fill-in Markers**
Each task that has `SETUP:FILL` must be completed before moving to the next one. When done, delete the marker.

**§4.5 Smallest Thing That Runs First**
No premature abstractions. Mock school data seeded in DB before any business logic. No "future-proofing."

---

## §5 Compliance Checklist (Living Document)

See `COMPLIANCE_CHECKLIST.md` for detailed NPC/DepEd audit requirements.

---

## §6 Files in This Project

- `CLAUDE.md` — This file. Project context, red flags, rules.
- `TASKS.md` — Live task list (updated after each turn).
- `LESSONS.md` — Log of discoveries, blockers, and rules derived from mistakes.
- `MOCK_SCHOOL_DATA.md` — Sample school dataset (150 students, 8 teachers).
- `COMPLIANCE_CHECKLIST.md` — NPC/DepEd requirements audit.
- `TERMS_OF_SERVICE_TEMPLATE.md` — ToS for DepEd schools.
- `PRIVACY_POLICY_TEMPLATE.md` — Privacy policy for embedded link.

---

## §7 First Move

Run:
```
grep -nE "^\*\*(BOOTSTRAP|INTAKE):" CLAUDE.md
```

If no output → bootstrap is complete, flip gate to `COMPLETE`, read `LESSONS.md`, start working.

If output → bootstrap tasks remain. Type `next` in your next message.
