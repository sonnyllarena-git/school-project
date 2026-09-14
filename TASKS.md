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

- [x] **Task AD: Real Sections (2 per Grade), Section-Scoped Subjects, Teacher Schedule-Conflict Check**
  - Every grade now has two real sections (A and B), each with its own adviser/room/class — not just
    a UI label. 6 new teachers added (n:9-14 in `seed.js`) as Section B advisers; the original 8
    teachers (n:1-8) are unchanged, so existing demo logins (teacher.1@ through teacher.8@) still work
  - `subjects.section` added — a subject is now a (grade, section, subject) instance, not just
    (grade, subject); codes are still globally unique (e.g. `MATH1A` vs `MATH1B`), which is a strictly
    stronger guarantee than "unique per grade"
  - Subjects tab restructured per explicit direction: Grade is now a filter (`<select>`, was tabs),
    and Section is now the tab row underneath it — "section tabs per grade," not "grade tabs"
  - **Teacher schedule-conflict check** (the actual ask, phrased as a hypothetical by the user and
    built as a real rule): `PUT /admin/subjects/:subjectId/teachers` now rejects (409) assigning a
    teacher to a subject whose days/time overlap with another subject that same teacher already
    teaches — checked before any write, all-or-nothing. Surfaces in the Subject Detail modal as a
    plain-language error naming the conflicting subject
  - Fixed two latent single-section assumptions this change would otherwise have broken:
    `enrollment.js`'s promotion pipeline used to hardcode `newClassId = CLS<grade>` when issuing a
    certificate (only correct with one class per grade) — now looks up the student's *own* section and
    promotes into the matching section of the next grade (Grade N - X → Grade N+1 - X). Both
    `enrollment.js` and `student.js`'s certificate routes also hardcoded `section: 'A'` in their JSON
    response — now read the real section
  - Bug found and fixed *during this task's own testing*: the seed data initially assigned each
    floating co-teacher (Rosa Guinto, Alfonso Reyes) to the same subject across grades 4, 5, **and** 6
    Section A — but every grade shares the same fixed time-of-day per subject name, so that assignment
    was already double-booking the same teacher at the same time in three different rooms. The new
    conflict check correctly caught this the moment it was exercised. Fixed by scoping each floating
    teacher's co-teaching to one (grade, section, subject) only — see LESSONS.md
  - Verify: curled a genuine conflict (rejected, correct message) and a genuine non-conflict
    (accepted); ran the full re-enrollment pipeline end-to-end on a **Section B** student
    (STU-000025) — verify → assess → print → pay → issue certificate → confirmed `class_id` moved
    `CLS001B → CLS002B` (not into Section A) and the certificate's `section` field reads "B"; in the
    browser, switched Grade filter and Section tabs, opened the Subject Detail modal and tried to
    assign an already-double-booked teacher (rejected with the conflict message shown inline) then a
    valid one (accepted); logged in as a Section B student and confirmed "My Schedule" shows only
    their own section's subjects/teacher/room, not Section A's; reseeded afterward to reset all
    test-induced mutations back to a clean baseline

- [x] **Task AE: Admin Schedules Tab**
  - New read-only "Schedules" admin nav tab — Grade filter + Section tabs (same navigation pattern as
    Subjects), rendering the shared `ScheduleView` component instead of the subject-management table.
    No backend changes: reuses `GET /admin/subjects` (already returns every grade/section's subjects
    with teacher + schedule), just reshaped into `ScheduleView`'s expected shape client-side
  - The student side already only sees their own schedule (`GET /student/schedule`, built in Task AC,
    scoped to the student's own class) — nothing to change there, just confirmed still correct
  - Verify: switched Grade and Section on the new tab and confirmed the right class's subjects/
    teacher/room/time render each time (spot-checked Grade 1-A and Grade 6-B)

- [x] **Task AF: Day-of-Week Filter on Schedule Views**
  - Added a day filter (All Days / Mon / Tue / Wed / Thu / Fri tabs) directly inside the shared
    `ScheduleView` component rather than in any one page — it filters `schedule.subjects` client-side
    by checking whether the selected day token appears in that subject's free-text `schedule_days`
    (e.g. "Mon/Wed/Fri"). Since `ScheduleView` is shared, this one change applies everywhere it's
    used: the new admin Schedules tab, the student's "My Schedule" tab, and the admin's Student Detail
    modal — no per-page duplication, no backend change
  - Verify: on both the admin Schedules tab and a student's own "My Schedule," clicked "Monday" and
    confirmed only the Mon/Wed/Fri subjects (Filipino/Math/Values Education) remained, with the
    Tue/Thu subjects (English/Science) correctly hidden; clicked back to "All Days" and confirmed the
    full 5-subject list returned

- [x] **Task AG: Admin Grades View + Real Quarter Metadata**
  - New `GET /admin/students/:studentId/grades` (admin.js) — same shape as the student's own
    `GET /student/grades`, scoped to any student in the school. New shared `GradesView` component
    (mirrors `AccountView`/`ScheduleView`) groups rows by quarter and renders them in `First → Fourth`
    order (sorted explicitly, since the DB's alphabetical default would put "Fourth" before "Second").
    Added to the Student Detail modal (double-click a student on the Students page), positioned first
    — before Account and Schedule — to match the student nav's own priority order (My Grades comes
    before My Account)
  - **Quarters formalized as real metadata**: added `GRADING_PERIODS` to `curriculum.js` (single source
    of truth, same pattern as `SUBJECTS`/`SUBJECT_CODES`) and now validate `grading_period` server-side
    in `POST /teacher/classes/:id/grades` (previously accepted any string with no validation)
  - Seed data expanded from 1 quarter to all 4 (750 → 3,000 grade rows) — previously *every* student
    only had "First Grading" grades seeded, so a 4-quarter feature had nothing to demonstrate
  - **Bug this surfaced and fixed**: `enrollment.js`'s promotion-eligibility check flagged a student as
    failing if *any single quarter's* final grade dipped below 75 — harmless with only 1 quarter of
    data, but with 4 independently-randomized quarters this would falsely block otherwise-passing
    students on a bad one-quarter dip. Changed to average `final_grade` per subject across all
    recorded quarters (`AVG(...) GROUP BY subject`) before comparing to the passing grade — matches
    real DepEd practice (general average), not just more lenient
  - Refactored `StudentGrades.jsx` (student's own "My Grades") to use the new shared `GradesView`
    instead of its own duplicate grouping-by-quarter logic — one fewer copy of the same rendering code
  - Verify: curled the new endpoint (confirmed 20 rows — 5 subjects × 4 quarters — for a test student);
    curled grading_period validation (rejected "Fifth Grading", accepted "Second Grading"); curled
    eligibility for a student with mixed quarter scores (confirmed no false failing-subject flag); in
    the browser, opened the Student Detail modal and confirmed all 4 quarters render in the correct
    order with full exam breakdowns, then confirmed the student's own "My Grades" page still renders
    identically post-refactor; reseeded afterward to clear a test-write artifact

- [x] **Task AH: Admin SOA Print Preview**
  - New standalone printable page `StatementOfAccount.jsx` (`/admin/students/:studentId/soa`) —
    mirrors `Certificate.jsx`'s established pattern exactly: no sidebar/`Layout`, a `.no-print`
    back-link + Print button row, content in the existing `.certificate` CSS class (already has
    `@media print` rules), `window.print()`, no PDF library
  - "Print Preview" entry points added in both places the SOA is already shown: the Admin Accounts
    page (button above `AccountView`, navigates in the same tab — back link returns to
    `/admin/accounts?student=<id>` so the selection isn't lost) and the Student Detail modal
    (button labeled "Print Preview (SOA)", opens in a new tab since closing it shouldn't lose the
    admin's place in the Students list/modal)
  - `GET /accounts/students/:studentId` (accounts.js) now also returns `lrn` — needed for the printed
    document but wasn't being selected before (only `student_id`, `name`)
  - Verify: clicked "Print Preview" from the Accounts page — confirmed the standalone page renders
    school name, student name/LRN/grade-section/adviser, status pill, itemized charges, totals, and
    payment history, with a working Back link back to the same student; confirmed the same button
    exists and works from the Student Detail modal (double-click a student on the Students page)

- [x] **Task AI: Printable Report Card, Audit Log Viewer, Edit School Info**
  - **Report Card** (`ReportCard.jsx`, same standalone-printable pattern as `Certificate.jsx`/
    `StatementOfAccount.jsx`): pivots the flat per-quarter grade rows (already returned by the existing
    `GET /admin/students/:id/grades` and `GET /student/grades`) into one row per subject with a
    column per quarter, a general average, and Passed/Failed remarks. **No backend changes** — the
    admin version combines `getStudentGrades` + the already-rich `getAccount` response (which already
    had name/lrn/grade/section/adviser) for the header; the student version combines `myGrades` +
    `myAccount` + `session.user.name` (their own account endpoint has no LRN, so the student's own
    report card just omits that line). Entry points: "Print Report Card" button in the Student Detail
    modal (admin, opens in a new tab) and on the student's own "My Grades" page (same tab)
  - **Audit Log viewer** (`AdminAuditLog.jsx`, new "Audit Log" admin nav tab): new
    `GET /admin/audit-logs` returns the most recent 200 `audit_logs` rows for the school, joined to
    `users` for a human-readable name/role instead of a raw `user_id`. This is the first UI surface
    for the audit logging CLAUDE.md §1.1 already required and had been writing to since Task A/K —
    previously the data existed but nothing ever displayed it
  - **Edit School Info**: the Dashboard's "School Info" card was read-only despite `PATCH /admin/school`
    existing since Phase 1 — added an Edit/Save/Cancel toggle backed by that same endpoint (no backend
    change needed here either)
  - `GET /accounts/students/:studentId` now also selects `lrn` (was already selecting `name`) — the
    Report Card needed it and it was a one-line addition to an existing query
  - Verify: curled `/admin/audit-logs` (confirmed real LOGIN rows, then triggered a deliberate failed
    login and confirmed a `FAILURE` row appeared); curled the school PATCH end-to-end; in the browser,
    edited and saved School Info (confirmed persisted, then reverted), viewed the Audit Log page
    (real login history), opened the admin Report Card for a student (correct pivot table + general
    average + remarks) and the student's own version (same data, no LRN line, as designed)

- [x] **Task AJ: Allow Certificate Issuance on Partial Payment (Next School Year)**
  - Deliberate business-rule reversal, by direct request: `POST /enrollment/:studentId/issue-certificate`
    previously required the *next* school year's balance to be `FULLY_PAID` (Task W's original design).
    Now only rejects `PENDING_PAYMENT` (literally zero paid) — `PARTIALLY_PAID` or `FULLY_PAID` both
    proceed. Confirmed via AskUserQuestion: (a) zero payment still blocks it, partial is enough;
    (b) the CURRENT year's eligibility gate (for the earlier Verify step — zero balance + no failing
    grades) is unchanged, this only loosens the LAST step
  - Nothing is written off — the outstanding balance for the new school year keeps existing in
    `fee_items`/`payments` exactly as before and still shows on the Accounts page; only the *promotion
    gate* changed, not the ledger
  - `AdminEnrollment.jsx` UI updated to match: shows the payment form whenever there's a balance
    (so admin can keep collecting), and separately shows "Issue Certificate of Matriculation" whenever
    status isn't `PENDING_PAYMENT` — with an inline warning naming the outstanding balance when
    issuing while still partially paid. Previously these two were mutually exclusive (one or the
    other, gated on `FULLY_PAID`)
  - Verify: curled a `PENDING_PAYMENT` student's issue-certificate attempt (still rejected — "at least
    a partial payment... required"), then added a small payment and confirmed it then succeeded;
    curled the full pipeline for a `PARTIALLY_PAID` student (STU-000001, ₱12,800 owing) and confirmed
    `class_id` flipped to the next grade's class *and* the ₱12,800 balance is still fully intact when
    queried for that school year (nothing written off); in the browser, ran a fresh student
    (STU-000008, Ricardo Reyes) through the real UI with a partial payment and confirmed the same
    result end-to-end — pipeline shows "Certificate Issued — Enrolled" and the student's own record
    shows Grade 2

- [x] **Task AK: "View Account" Link on Ineligible-for-Promotion Banner**
  - When "Not yet eligible" is showing because of an outstanding CURRENT-year balance,
    `AdminEnrollment.jsx` now also shows a note ("Admin/Cashier/Registrar: record the missing payment
    on the student's Account...") and a "View Account" button that jumps straight to
    `/admin/accounts?student=<id>` — the same deep-link pattern the Students page already uses. Only
    shown when `balance > 0` (a failing-grades-only block wouldn't be solved by visiting Accounts)
  - Verify: selected a student with a ₱12,668 current-year balance, confirmed the note + button
    appear, clicked it, and confirmed it landed on `/admin/accounts?student=STU-000013` with that
    student's account already loaded

- [x] **Task AL: Editable Next-Year SOA (Parent-Requested Corrections)**
  - Fills a real gap the user described: after Assess generates the incoming grade's SOA, a parent is
    supposed to review the printed copy before paying — but there was previously no way to actually
    correct a line item if they flagged something wrong. New `POST/PATCH/DELETE
    /accounts/students/:studentId/fee-items[/:feeItemId]` (accounts.js) — add, edit (fee_type/amount/
    description), or remove one fee item; each returns the recomputed account so
    `total_assessed`/balance/status stay live. Not restricted to a particular enrollment stage or
    school year at the API level (a UI concern only) — editing after a payment is already recorded
    just changes the resulting balance, nothing is silently lost
  - `AdminEnrollment.jsx`: new itemized, editable "Statement of Account" card shown during BOTH the
    ASSESSED and PRINTED stages (previously the SOA's line items weren't visible anywhere on this page
    at all, only summary totals during PRINTED) — inline Edit/Remove per row, "+ Add Item" form,
    recalculated Total Assessed. This is now the actual workflow: Verified → Assess (generates SOA,
    editable here) → parent reviews the printed copy offline → if a correction is needed, admin edits
    it right here → pay → Issue Certificate
  - Verify: curled all three operations directly (edited Books' amount, added a Field Trip Fee item,
    removed Notebooks & Supplies — confirmed `total_assessed` recalculated correctly each time); in the
    browser, opened the new SOA card at the ASSESSED stage, edited an item's amount through the actual
    UI, and confirmed the change persisted via a direct query; advanced the same student to PRINTED
    and confirmed the same editable card (with the correction still applied) appears there too,
    alongside the existing payment form and Issue Certificate button

- [x] **Task AM: Balance Never Goes Negative**
  - Task AL's fee-item editing made this a real, reachable case: editing a fee item down (or removing
    one) after a payment already covers the *old*, higher total would leave `total_assessed < total_paid`
    — an overpayment, however it happens, produces the same shape of problem. Fixed once in
    `computeStatus()` (`backend/src/lib/account.js`, the single shared helper every balance
    computation already goes through) by clamping with `Math.max(0, ...)` — the excess isn't tracked
    as a credit, it just reads as ₱0 owing
    Fixing it there means every consumer got the fix for free: `getStudentAccount`
    (admin/student account views, Enrollment page, SOA/Report Card printables) and the bulk
    per-student summaries in `accounts.js`/`admin.js` (Accounts page, Students page)
  - Verify: recorded a deliberate ₱50,000 payment against a ₱22,800 assessment — balance read ₱0 (not
    -₱27,200), status `FULLY_PAID`; then removed a ₱15,000 fee item on top of that (assessed dropped
    to ₱7,800, still far below the ₱50,000 paid) and balance still correctly read ₱0, not negative;
    reseeded afterward to clear the deliberately-extreme test data

- [x] **Task AN: Actual Print Preview for the Incoming-Grade Assessment**
  - Real gap: "Mark as Printed for Parent" only ever flipped an enrollment status flag — nothing was
    actually printable. `StatementOfAccount.jsx` (Task AH) also only ever showed the *current* school
    year, so even the existing SOA printable couldn't show an incoming-grade assessment
  - `StatementOfAccount.jsx` now reads an optional `?school_year=` query param and passes it through
    to `getAccount`; `AdminEnrollment.jsx` gained a "Print Preview" button (next to "+ Add Item" on the
    new SOA card) that opens `/admin/students/:id/soa?school_year=<enrollment.school_year>` in a new
    tab. Also added `?student=` deep-link support to `AdminEnrollment.jsx` (matching Accounts/Students)
    so the printable page's Back link can return to the right student instead of losing the selection
  - **Bug found and fixed while verifying this**: the printed incoming-grade SOA showed the student's
    *current* grade/section/adviser (Grade 1, Ms. Ana Gonzales), not the grade they're being promoted
    into (Grade 2, Mr. Carlos Ramos) — because `class_id` doesn't actually move until the certificate
    is issued, and `getStudentAccount()` was deriving grade/section/adviser from the student's current
    class regardless of which school year's account was being requested. Fixed in `account.js`: when
    an `enrollments` row exists for the requested school year, look up the *incoming* class (same
    section letter, whichever class that already is) instead of the student's current one. Current-
    year lookups are completely unaffected (no enrollments row ever exists for the current year)
  - Verify: curled the incoming-year account (now correctly returns Grade 2 / Mr. Carlos Ramos) versus
    the current-year account for the same student (still correctly Grade 1 / Ms. Ana Gonzales); in the
    browser, opened the printable page at `?school_year=2026-2027` and confirmed it shows "Grade 2 — A"
    and the right adviser, confirmed the Back link returns to `/admin/enrollment?student=<id>`, and
    confirmed the plain current-year SOA and the Report Card page are both unaffected by the change

- [x] **Task AO: Payment Rejected Outright If It Would Overpay**
  - User-reported follow-up to Task AM's clamp: rejected instead of clamped, so an overpayment (typo,
    wrong student) bounces back to the cashier instead of silently succeeding at ₱0 owed.
    `POST /accounts/students/:studentId/payments` now checks `amount > balance` before inserting and
    returns 400 with the actual balance if so
  - Verify: curled an overpayment (400, correct message) and a valid partial/exact payment (both 201);
    in the browser, submitted an overpayment through the actual Accounts page form and confirmed the
    error banner rendered via the existing error-banner UI, no frontend changes needed

- [x] **Task AP: "View Grades" Link on Failing-Subject Ineligibility Banner**
  - Mirrors Task AK's "View Account" pattern but for the other ineligibility cause: added `?student=`
    deep-link support to `AdminStudents.jsx` and a "View Grades" button on the banner when
    `failing_subjects.length > 0`, jumping straight to that student's detail modal (which already shows
    per-quarter grades)
  - Verify: clicked through from a real failing-grade banner (Angela Mercado, Filipino) and confirmed the
    modal opened showing the exact quarters/scores explaining the block

- [x] **Task AQ: Teacher Grade Entry Pre-Fills Existing Scores**
  - Real bug found while answering a user question about correcting a grade after a retake/makeup exam:
    Grade Entry always loaded blank inputs, and saving is a full-row overwrite — so "fixing" one
    student's final grade would have silently wiped every other student's scores for that subject/
    period. New `GET /teacher/classes/:classId/grades?subject=&grading_period=` (teacher-owns-this-
    class checked) + `TeacherGrades.jsx` now pre-fills the roster with whatever's already on file
  - Verify: as a real teacher login, opened Filipino/First Grading, confirmed real scores pre-filled;
    bumped one student's final grade and saved; confirmed via the API that only that field changed —
    her exam scores and every other student's row were untouched

- [x] **Task AR: Unique Student Names in Seed Data**
  - `seed.js` picked first names via `studentSeq % 12` (only 12 slots) and surnames via
    `(studentSeq * 7) % 20` — cycled and produced repeats (multiple "Angela Hernandez"s in different
    grades). Fixed by building the full 12×20 (first, surname) cross-product per gender, shuffling once,
    and handing out one unique pair per student (240 combos per gender, only 75 needed)
  - Verify: reseeded, confirmed 150/150 unique names via the API and in the Students page

- [x] **Task AS: Fix Stale Account Status After Promotion**
  - User-reported: paid full tuition for the next grade, but the account still showed "Fully Paid" from
    the *previous*, already-completed grade — because every account view defaulted to the fixed
    `CURRENT_SCHOOL_YEAR` regardless of whether the student had already been promoted. New
    `getActiveSchoolYear(studentId)` in `account.js`: once a certificate is issued for the next year,
    that year becomes the student's active obligation everywhere (Accounts page, Students roster badge,
    payment recording) instead of the fixed constant
  - Verify: confirmed the promoted student's account now resolves to the next year/correct partial-paid
    balance in the API, the Accounts page, and the Students roster; regression-checked that 147/150
    non-promoted students still correctly resolve to the current year

- [x] **Task AT: Accounting Tab**
  - New school-wide financial tab (brainstormed with the user, who picked Ledger + Summary + Outstanding
    + Fee Type Breakdown/CSV Export): `GET /accounts/ledger` (every payment, filterable), `GET
    /accounts/summary` (assessed/paid/outstanding, by method, by fee type), reusing the existing
    per-student list for Outstanding Balances. Added `payments`/`fee_items` to the CSV export catalog
  - Verify: curled both new endpoints (numbers cross-checked), confirmed CSV downloads, exercised the
    live page (search filter, school-year filter updating summary+ledger together, "View Account" nav)

- [x] **Task AU: User Management Tab**
  - New `/admin/users` tab consolidating account creation: Add Teacher (moved out of the Teachers tab,
    now list-only) and a new Add Student form — the first admin-reachable way to create a student with
    an actual portal login (CSV import only ever left `user_id` NULL). Admin can also reset any user's
    password directly (`PATCH /admin/users/:userId/password`, no `current_password` needed, logged as a
    `PASSWORD_RESET` audit entry)
  - Verify: created a test student, logged in with the generated credentials, reset the password (old
    rejected, new worked), confirmed the audit log entry; confirmed Teachers tab no longer shows Add
    Teacher

- [x] **Task AV: Cashier/Registrar Roles, Guardian Info, Messaging, Requirements, Documents Tab**
  - The big one — five things requested together after a "what else can we add" brainstorm:
    1. **New CASHIER role** (`cashier@stmichaels.ph` / `Cashier@2025`) alongside the existing REGISTRAR,
       each with their own dashboard and nav. Permission split (confirmed with the user): Cashier can
       view Accounts/Accounting and record payments, but not touch Enrollment/Requirements/Documents.
       Registrar owns Enrollment/Requirements/Documents and can still view balances/edit fee items
       (assessment corrections), but recording a payment is Cashier-exclusive now — `accounts.js`'s
       single blanket role gate was split into per-route `VIEW_ROLES`/`PAYMENT_ROLES`/`FEE_ITEM_ROLES`.
       `enrollment.js` opened up to REGISTRAR (was ADMIN-only, despite Enrollment conceptually being a
       registrar function all along). New dashboards: `RegistrarDashboard` (promotion-pipeline stage
       counts via new `GET /enrollment/summary`, requirements completion), `CashierDashboard` (reuses
       the Accounting summary). Fixed a real bug found while building this: `Login.jsx`'s `HOME_BY_ROLE`
       had no entry for REGISTRAR, so a registrar logging in was bounced straight back to the login page
    2. **Guardian/emergency contact info**: new `students` columns (guardian name/relationship/phone/
       email, emergency contact name/phone), populated for all 150 mock students in `seed.js`, shown in
       the Student Detail modal, and addable via the Add Student form
    3. **Messaging** (the original MVP item from CLAUDE.md §2, never built) — scoped to announcements
       only per the user's choice (no private 1:1 threads, no read/unread state): new `messages` table,
       `GET/POST /messages`. Admin/Teacher/Registrar can compose to an audience (Everyone / a specific
       Grade+Section / a specific student — the last restricted to Admin/Registrar in the UI since a
       teacher has no general student directory to pick from); every role sees a shared `/messages`
       inbox filtered to what's addressed to them
    4. **Requirements system**, under Registrar per the request: new `student_requirements` table plus
       a fixed `REQUIREMENT_TYPES` catalog in `curriculum.js` (Birth Certificate, Form 137, Good Moral
       Certificate, Medical/Immunization Record, ID Photos, Parent's Valid ID). Registrar checklist UI
       per student, status PENDING/SUBMITTED/VERIFIED, rows created lazily (no DB row until a status is
       actually set)
    5. **Documents tab**, Registrar-only: a hub page linking every printable document for a selected
       student — the three existing ones (Certificate of Matriculation, SOA, Report Card) plus three
       new ones built this round (Good Moral Certificate, Honorable Dismissal, Transcript of Records —
       the last aggregates grades across every grade level a student has been recorded under, since
       `grades` rows are pinned to a grade level via `class_id`, not an explicit school-year column).
       Cashier access to this tab was explicitly deferred, not built, per the user's own scoping
  - Verify: full role-permission matrix tested via curl (Cashier 403 on Requirements/Documents/
    Enrollment, 200 on Accounts/payments; Registrar 403 on payments, 201 on fee-items, 200 on
    enrollment/summary) before touching the browser at all. Then in the browser: logged in as Registrar
    (correct nav, dashboard stats, requirements checklist status-change persisted with verified_by/
    verified_at, Good Moral/Transcript printables rendered with real data) and as Cashier (correct nav,
    dashboard summary + top-outstanding list, blocked from Documents, "Record Payment" shortcut into
    Accounts worked); composed and read back a real announcement as Teacher and confirmed a Grade-1-A
    student's inbox showed exactly the messages addressed to them (ALL + their own grade/section, not
    other grades); created a real student through Add Student with guardian fields and confirmed they
    persisted; deleted the test student and reseeded to a clean baseline afterward

- [x] **Task AW: Admin Full Access to Registrar/Cashier Tabs (Standing Rule)**
  - User-reported gap right after Task AV: `/registrar` and `/cashier` were the only two routes in the
    whole app that excluded ADMIN (accidentally scoped to only their own role when first built) — Admin
    couldn't view either dashboard at all. Widened both `ProtectedRoute` role lists, and added
    Requirements/Documents to Admin's nav (genuinely new tools; left the two dashboard *routes*
    reachable-but-not-nav-linked for Admin since Admin's own Dashboard/Accounting already cover similar
    ground)
  - User then said this should be a standing rule, not a one-off fix: every new role-gated tab/route
    from here on must include ADMIN — backend `requireRole(...)`, frontend `ProtectedRoute`, and the nav
    when it's a genuinely new tool. Saved to memory (`feedback_admin_full_access.md`) so this isn't
    re-litigated in a future session
  - Verify: logged in as Admin, confirmed Requirements/Documents now in the nav, and confirmed
    `/registrar` and `/cashier` load correctly instead of bouncing to `/login`

- [x] **Task AX: Official Receipts, Requirements↔Enrollment, Cashier Documents Access**
  - Three more items picked from a "what's next" brainstorm, built together:
    1. **Official Receipt printable** — every payment needed a way to print a receipt, not just show up
       as a ledger row. New `GET /accounts/students/:studentId/payments/:paymentId/receipt` (balance
       computed as of THAT payment, not "today"); new `OfficialReceipt.jsx` printable page at
       `/admin/students/:studentId/receipt/:paymentId`; "Print Receipt" added to every payment row in
       both `AccountView.jsx` (Accounts page + Student Detail modal — hidden on a student's own
       self-view since `myAccount` doesn't return `student_id`, `getAccount` does) and the Accounting
       ledger
       - **Bug found and fixed while building this**: `paid_to_date` always read 0 (so every receipt
         showed the full balance as unpaid) — `payment.recorded_at` was round-tripped through a JS
         `Date` object and passed back as a query parameter, but TIMESTAMPTZ has more precision than a
         JS Date preserves, so `recorded_at <= $param` silently never matched, not even the payment's
         own row. Fixed by keeping the comparison entirely in SQL via a subquery keyed on `payment_id`,
         never serializing the timestamp through JS at all
       - **Second bug found while browser-testing**: the receipt number (`payment_id.slice(0,8)`) was
         meant to shorten a UUID, but seed data uses human-readable IDs like `PAY-STU-000001-1` — every
         seeded payment for a given student truncated to the same generic prefix. Fixed by just showing
         the full `payment_id`
    2. **Requirements tied to Enrollment**: `AdminEnrollment.jsx` now fetches the selected student's
       requirements checklist and shows a non-blocking warning banner when not everything is VERIFIED,
       with a link into Requirements (added `?student=` deep-link support there to match)
    3. **Cashier's Documents access resolved**: `/registrar/documents` widened to include CASHIER, but
       `RegistrarDocuments.jsx`'s `DOCUMENT_TYPES` now carry a `roles` field and the page filters by
       `session.user.role` — Cashier sees only Statement of Account and the new Official Receipt card
       (defaults to the student's most recent payment via new `GET .../payments/latest`); Good Moral/
       Honorable Dismissal/Transcript/Certificate of Matriculation stay Admin+Registrar only
  - Verify: curled the receipt endpoint before and after the timestamp fix (paid_to_date 0 → correct);
    in the browser confirmed the full receipt renders with correct balance math, confirmed every ledger
    row (Accounts + Accounting) has a working Print Receipt button; logged in as Cashier and confirmed
    Documents nav appeared with exactly 2 cards (SOA, Official Receipt) and the receipt button was
    enabled for a student with a payment on file; logged in as Registrar and confirmed all 7 document
    cards still show; selected a 3/6-complete student on Enrollment, confirmed the warning banner text
    and count, clicked through to Requirements and confirmed the right student was pre-selected

- [x] **Task AY: Admin Sidebar Cleanup — Administration Page**
  - User-reported: the Admin sidebar had grown to 15 items, too much for one flat list. Brainstormed
    scope (which items move, where they land) and confirmed with the user before building: consolidate
    User Management, Import Roster, Data Export, and Audit Log — the infrequent, config-style tools —
    into one new `/admin/administration` page with its own query-param-based tab bar (`?tab=users|
    import|export|audit`, so a tab is directly linkable), rather than hiding them one level deeper
    behind a collapsible section. Daily-workflow items (Students, Accounts, Accounting, Enrollment,
    Requirements, Documents, Messages, Teachers/Subjects/Schedules) stayed on the main sidebar
  - Implementation: stripped the `<Layout>` wrapper out of `AdminUserManagement.jsx`, `AdminImport.jsx`,
    `AdminExport.jsx`, and `AdminAuditLog.jsx` (each now renders just its content), and built the new
    `AdminAdministration.jsx` as the single page that owns the `<Layout>` + tab bar and swaps between
    them. Removed their four standalone routes/nav entries in favor of the one consolidated route/entry
  - Result: Admin's sidebar dropped from 15 items to 12 (Dashboard, Teachers, Subjects, Schedules,
    Students, Accounts, Accounting, Enrollment, Requirements, Documents, Messages, Administration)
  - Verify: confirmed the new sidebar count and labels in the browser; clicked through all 4
    Administration tabs (User Management, Import Roster, Data Export, Audit Log) and confirmed each
    renders its real content with working data (Audit Log's "Recent Activity (18)" count in particular,
    after an initial false alarm that turned out to be a test-timing artifact, not a real bug); confirmed
    the tab switch updates the URL query param; ran a full regression sweep of all 12 admin routes plus
    the old removed routes (correctly redirect to /login rather than 404/blank) with no console or
    backend errors

