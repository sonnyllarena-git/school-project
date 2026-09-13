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
  - `GET /admin/export/:table` (CSV of students/teachers/attendance/grades), filterable by `class_id`,
    `student_id`, and (attendance) `from`/`to` date range — full dataset when no filter given
  - Verify: exported CSV row counts match DB counts; `?student_id=` returns only that student's rows
  - Pass condition: matches MVP feature 7 / red-flag §1.3 (vendor lock-in prevention) and
    COMPLIANCE_CHECKLIST.md §4.1 "by date range, by class, by student, or full dataset"

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

- [x] **Task Q: Disaster Recovery — Backups, Restore & Status Page**
  - Backup script: dumps all tables to a timestamped JSON file, logs a row in `backups`, prunes files older
    than 30 days
  - Restore script: `npm run restore -- <file>.json` — stop the app first (see LESSONS.md for why),
    replaces all data from a backup file
  - Public `/status` endpoint (no auth) + a public status page showing current health and recent history
  - Verify: ran backup, deleted 2 real students + their records, ran restore, confirmed those exact
    students came back; hit `/status` with no token, saw history
  - Pass condition: matches CLAUDE.md §1.5 (daily backup, 30-day retention, **restorable**, public status page)
  - Note: DB failover replica / zero-downtime deploy are hosting-tier decisions (managed Postgres plan,
    host's deploy pipeline), not application code — flagged, not built here

- [x] **Task R: Right-to-Deletion**
  - `GET /admin/students` (roster list), `DELETE /admin/students/:studentId` (cascades attendance/grades/
    fee_items/payments/enrollments, audit-logged)
  - Admin UI: students list page with a delete action (confirm before deleting)
  - Verify: delete a student, confirm all related rows are gone and an audit_log entry exists
  - Pass condition: matches CLAUDE.md §1.1 "Right-to-deletion feature"

- [x] **Task T: UI Polish — Icons, Settings Modal, Dark Mode**
  - Nav icons via `@heroicons/react` (MIT-licensed; confirmed `icons src/heroicons-complete-reference.json`
    is just a catalog of this same public library, not proprietary)
  - Moved "Log out" out of the sidebar into a gear-icon Settings modal (top-right of the topbar);
    modal also has a working dark mode toggle
  - Dark theme CSS variables (`:root[data-theme='dark']`), toggle persisted in `localStorage`
  - Verify: toggled dark mode, confirmed it applies app-wide with no unstyled/white elements left over
  - Lesson: caught 2 hardcoded `background: white` rules (`.topbar`, `input/select`) that don't
    respond to theme vars — only visible by actually looking at a dark-mode screenshot, not by
    reading the diff

- [x] **Task S: Privacy Policy / ToS Embedded in App**
  - `GET /legal/:doc` (public, no auth) serves the actual root `.md` docs — one source of truth
  - Frontend `/legal/:doc` page renders it (via `marked`); footer with Privacy Policy / ToS / Status
    links added to the login page and every authenticated page
  - Verify: opened `/legal/privacy-policy` with no session/token, content renders
  - Pass condition: matches CLAUDE.md §1.2 "Privacy Policy embedded in app (footer link, no login required)"

---

## Phase 3: Tuition/Accounts, Enrollment Workflow, Parent Role Removed

Scope change directed by the user (not in the original CLAUDE.md MVP list) — see LESSONS.md.

- [x] **Task U: Remove Parent Role**
  - Dropped `guardians`/`student_guardians` tables, removed `PARENT` from `users.role`, deleted
    `parent.js`/`ParentDashboard.jsx`/parent nav/login redirect
  - Reasoning: the student login is the shared family login — a parent uses their child's account,
    there's no separate parent identity
  - Verify: confirmed no `guardians`/`student_guardians` tables remain after migrate; grepped
    frontend + backend for stray `PARENT`/`guardian` references — none found

- [x] **Task V: Tuition — Statement of Account & Manual Payments**
  - `fee_items` (itemized charges) + `payments` (manual ledger — Cash/GCash/Bank Transfer, no payment
    gateway) tables, one lump sum per school year (not per grading period — user's call)
  - Enrollment/payment status is always computed (`PENDING_PAYMENT`/`PARTIALLY_PAID`/`FULLY_PAID`),
    never manually overridden (user's call)
  - `GET/POST /accounts/students/...` (Admin — doubles as "cashier", no separate role for now, per
    user), `GET /student/account` (read-only)
  - Mock data: realistic fee templates per grade band, ~2/3 of the 150 students have some payment
    history (full/partial/pending mixed)
  - Verify: recorded a real payment through the UI, watched status flip PENDING → PARTIAL → FULLY_PAID

- [x] **Task W: Grade Promotion / Re-Enrollment Workflow**
  - `enrollments` table: per-student, per-school-year pipeline — `VERIFIED → ASSESSED → PRINTED →
    CERTIFICATE_ISSUED` (parent approval is deliberately NOT a tracked stage — offline, between
    PRINTED and payment, per user's call)
  - Promotion gate: current-year balance = ₱0 AND no final grade below 75 (DepEd passing mark)
  - `CERTIFICATE_ISSUED` is the moment `students.class_id` actually moves to the next grade's class
  - Certificate of Matriculation: printable in-app page (`/admin/students/:id/certificate`,
    `/student/certificate`), not a PDF library — `window.print()`
  - Admin: new Enrollment page (eligibility check → pipeline actions → inline payment form → issue
    certificate). Student: new Enrollment page (current grade/subjects, promotion status, certificate link)
  - Verify: ran the full pipeline end-to-end for a real student (STU-000002) — eligibility → verify →
    assess → print → paid in full → certificate issued → confirmed `class_id` actually changed
    (CLS001 → CLS002) → confirmed the student's own login reflects all of it

- [x] **Task X: Settings Modal — Change Password, Notification Prefs, Language**
  - `GET /me`, `PATCH /me/password` (bcrypt-verified current password required), `PATCH
    /me/notifications` — role-agnostic (any authenticated user, not just Admin)
  - `users.notify_email`/`notify_sms` columns — **preference storage only**, no email/SMS provider
    wired up (see LESSONS.md)
  - Frontend: lightweight `i18n.jsx` (EN/Tagalog) — deliberately scoped to nav/login/settings/common
    buttons, not every page's full content (a much bigger effort) — toggle on Login page and in Settings
  - Verify: changed a real password through the UI, confirmed old password rejected + new one logs in;
    toggled SMS notifications, confirmed it persisted in the DB; switched language mid-session, confirmed
    nav/login strings translate and the choice persists across login
  - Lesson: the Settings modal panel had no `overflow-y`, so content taller than the viewport (once
    Notifications + Change Password were added) became unreachable — only caught by actually scrolling
    the rendered page, not by reading the JSX

- [x] **Task Y: Student Metadata (Grade/Section), Accounts Filters, Adviser Display, Teacher Subjects**
  - Grade/section were already modeled (`classes.grade_level`/`section` via `students.class_id`) —
    this task exposes them, not a new column: `GET /admin/students` and `GET /accounts/students` now
    join `classes` to return `grade_level`/`section` per student
  - `GET /accounts/students` now returns a full per-student summary (grade, section, adviser name,
    computed `total_assessed`/`total_paid`/`balance`/`status`) in one query — the Accounts page filters
    by Grade / Section / Payment Status entirely client-side against this list (150 rows, no need for
    server-side filter params)
  - `getStudentAccount()` (`backend/src/lib/account.js`) now also returns `grade_level`/`section`/
    `adviser_name` (adviser = the student's class's `teacher_id`) — surfaced on both the Admin Accounts
    page and the student's own Account page via a shared `AccountView` component change
  - New `teacher_subjects` table (`teacher_id`, `subject`) — independent of class advisory
    (`classes.teacher_id`): `GET /admin/teachers` returns each teacher's assigned subjects + which
    grade/section they advise (if any); `PUT /admin/teachers/:teacherId/subjects` replaces the full
    set. Admin Teachers page: click a subject chip to assign/unassign
  - Seed: the 6 grade advisers (1-6) are assigned all 5 `SUBJECTS` (matches what they already grade for
    their own class); the 2 floating teachers (no class) start with none assigned — a real "not yet
    assigned" case for the admin UI to demo against
  - Students page: added Grade/Section columns + a Grade/Section filter; clicking a row now navigates
    to `/admin/accounts?student=<id>`, which the Accounts page reads via `useSearchParams` to
    preselect that student
  - `backup.js`/`restore.js`/`seed.js` table lists updated to include `teacher_subjects`
  - Verify: curled every changed/new endpoint directly (grade/section present, adviser name correct,
    subject PUT validates against the fixed subject list and rejects unknown ones); in the browser,
    filtered Students by grade, clicked a row into Accounts and confirmed the right student + grade/
    section/adviser loaded, filtered Accounts by Fully Paid (56/150), toggled a subject chip on a
    floating teacher and confirmed it persisted in the DB
  - Bug found and fixed: first version of `getStudentAccount()`'s return statement used shorthand
    property `fee_items` instead of `fee_items: feeItems` — the destructured query result was named
    `feeItems` (camelCase), so the shorthand referenced a variable that didn't exist and threw
    `ReferenceError: fee_items is not defined` on every account lookup. Only caught by actually calling
    the endpoint (500 error), not by reading the diff.

- [x] **Task Z: Students Tab — Search, Enrollment Status, Details Modal**
  - Search box with a native `<datalist>` (browser-autocomplete on student name) — filters the table
    client-side by name or LRN substring match, alongside the existing Grade/Section filters
  - Replaced the roster `Status` column (raw `students.status` admin flag) with a computed
    **Enrollment Status** column (`PENDING_PAYMENT`/`PARTIALLY_PAID`/`FULLY_PAID` — same formula and
    labels as the Accounts page), and added it as a fourth filter
  - Extracted the shared status formula into `computeStatus()` (`backend/src/lib/account.js`), used by
    `getStudentAccount`, `GET /accounts/students`, and the newly-updated `GET /admin/students` — one
    source of truth instead of three copies of the same PENDING/PARTIAL/FULLY_PAID logic
  - Frontend: new `frontend/src/lib/accountStatus.js` (STATUS_LABEL/STATUS_PILL/STATUS_OPTIONS) shared
    by `AccountView`, `AdminAccounts`, and `AdminStudents` — same reasoning as the backend dedup
  - Row interaction changed from single-click-navigates to **double-click opens a modal**
    (`StudentDetailModal.jsx`): shows DOB/gender/roster status plus the same `AccountView` used
    elsewhere (grade/section/adviser/SOA/payment history), with a button to jump to the full Accounts
    page (to record a payment) — single click now does nothing, by design
  - New CSS: `.modal-backdrop.center`/`.modal-panel.wide` — the existing `.modal-panel` was sized and
    positioned for the narrow top-right Settings drawer, too cramped for a full account view
  - Verify: curled `/admin/students`, confirmed `enrollment_status`/`balance` present and correct; in
    the browser, searched "Angela" (13/150 matched across grades), filtered by Enrollment Status,
    double-clicked a row and confirmed the modal showed the *correct* student (there are same-named
    students in different grades — confirmed by LRN), single-clicked a row and confirmed nothing
    happens (no navigation, no modal)

- [x] **Task AA: Subjects Tab (per Grade, Subject Code/Name/Teacher(s))**
  - New Admin nav item "Subjects" → grade-tabbed page (Grade 1-6, reusing the existing `.tabs` CSS
    that had been defined but unused until now); each tab shows a table of Code / Subject / Teacher(s)
  - `teacher_subjects` gained a `grade_level` column (PK is now `teacher_id, subject, grade_level`) —
    assignment is scoped per grade, not just per teacher, because **one subject in one grade can have
    more than one teacher** (the actual ask): a floating specialist can co-teach alongside the class
    adviser. This superseded Task Y's teacher-centric subject toggle, which had no grade dimension
  - New `GET /admin/subjects` (grade × subject matrix, each cell listing assigned teachers) and
    `PUT /admin/subjects/:gradeLevel/:subject/teachers` (replaces the full teacher set for that
    grade+subject pair); removed the old `PUT /admin/teachers/:teacherId/subjects` (no grade context,
    would violate the new NOT NULL `grade_level` column)
  - Added `SUBJECT_CODES` to `curriculum.js` (Filipino→FIL, English→ENG, Math→MATH, Science→SCI,
    Values Education→VE) — computed server-side so the frontend doesn't hardcode a second copy
  - `AdminTeachers.jsx`'s per-teacher subject chips (Task Y) removed — editing now happens on the
    Subjects tab; Teachers page shows a read-only "Grade N: Subject, Subject" summary instead
  - Seed: advisers keep all 5 subjects for their own grade (as before); the two floating teachers,
    previously left unassigned, now co-teach specific subjects in grades 4-6 (Ms. Rosa Guinto —
    Values Education; Mr. Alfonso Reyes — Science) — a real multi-teacher-per-subject case to load
    the page with, instead of an empty one
  - Verify: curled `/admin/subjects` (confirmed Grade 4 Science lists both Ramon Santos and Alfonso
    Reyes), curled the PUT endpoint's validation (rejects an unknown subject, an out-of-range grade),
    and a real assignment change; in the browser, clicked between grade tabs, toggled a teacher chip
    on and confirmed it appeared instantly and matched the DB, toggled it back off, and confirmed the
    Teachers page's read-only summary reflects the same underlying data

- [x] **Task AB: Subject Catalog Rework — Admin-Created Subjects, Unique Codes, Schedule, Detail Modal**
  - Reworked Task AA's fixed-list subjects into a real admin-managed catalog: a new `subjects` table,
    one row per (grade, subject) *instance* — not a shared 5-item list. Each row has its own globally
    unique `code` (e.g. `MATH1` for Grade 1 Math vs `MATH4` for Grade 4 Math — previously both were
    just "MATH"), and its own mock schedule (`schedule_days`, `start_time`, `end_time`, `room`)
  - `teacher_subjects` now keys off `subject_id` (FK into `subjects`) instead of a free-text
    `(subject, grade_level)` pair — a straight rename of what it points at, same many-to-many shape
  - `POST /admin/subjects` lets the admin create a new subject for a grade (own code/name/schedule);
    duplicate codes rejected with 409. `PUT /admin/subjects/:subjectId/teachers` replaces the old
    grade+subject-keyed route now that subjects are individually identified
  - Frontend interaction redesigned per explicit feedback — **no more click-a-chip-and-it-assigns-
    immediately** in the table:
    - Main table now shows only Code + Subject + an expand arrow; clicking it reveals Teacher(s) +
      Schedule + Room inline (read-only) — teacher chips removed from the table entirely
    - Double-clicking a subject row opens `SubjectDetailModal` (code, name, grade, schedule, current
      teachers with individual Remove buttons, a "assign another teacher" dropdown + button) — assignment
      now happens deliberately inside a modal you had to double-click to open, not by brushing past a
      chip in the table
    - New `AddSubjectModal` (button: "+ Add Subject" on the Subjects tab) lets the admin create a
      subject for the currently-open grade tab
  - Scope boundary (flagged, not solved): this catalog is independent of `grades.subject` (free text,
    teacher grade entry) and curriculum.js's fixed `SUBJECTS` list (enrollment/grade-entry display) —
    a subject added here does not become gradeable in Teacher > Grades or appear on the enrollment
    subjects list. Unifying those is a separate, bigger task, not assumed done
  - Open question raised back to the user (not yet built): where the per-subject mock schedule should
    surface for students — a new "My Schedule" tab, a card on Student Accounts, or the printable
    Certificate of Matriculation. Recommended a new tab (see chat) but held off building it pending
    the user's call
  - Verify: curled `POST /admin/subjects` (created, then rejected a duplicate code, then rejected
    missing fields); in the browser confirmed unique per-grade codes render (ENG1/FIL1/.../ENG4/...),
    expanded a row to see teacher(s) + schedule + room, double-clicked to open the detail modal,
    assigned and then removed a teacher from inside the modal (confirmed against the DB both times),
    created a real subject via "+ Add Subject" and confirmed it appeared in the table, and confirmed
    the Teachers page's read-only summary still renders correctly against the reworked schema

- [x] **Task AC: Student-Facing Schedule View**
  - Resolved the open question from Task AB (asked the user where the schedule should surface) —
    a new "My Schedule" student tab, not a card on Accounts (money-focused page) or the printable
    Certificate (a one-time promotion record, not a living timetable)
  - `GET /student/schedule` — resolves the student's own class → grade level, returns that grade's
    subjects with teacher(s), days, time, and room (same shape `/admin/subjects` already produces per
    grade, just scoped to one student's own grade instead of the whole school)
  - New shared `ScheduleView` component (mirrors how `AccountView` is shared between the admin Accounts
    page and the student's own Account page) — used by the new student "My Schedule" page **and**
    added as a section inside the admin `StudentDetailModal` (Task Z), so an admin double-clicking a
    student on the Students page now sees that student's schedule alongside their SOA in one place
  - Extracted `formatTime()` (HH:MM → "8:00 AM") out of `AdminSubjects`/`SubjectDetailModal` into a
    shared `lib/format.js` while touching those files again, rather than adding a third copy in
    `ScheduleView`
  - Verify: curled `/student/schedule` as a Grade 1 student (confirmed 5 subjects with the seeded
    schedule); in the browser, opened "My Schedule" as a student and saw the same 5 subjects with
    days/time/room; double-clicked a student on the admin Students page and confirmed the same
    student's schedule appears inside the detail modal, below their Statement of Account

