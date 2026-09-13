# Lessons Learned

This file logs discoveries, blockers, and rules that emerged during development.

Append new entries as they occur. Promote a pattern to *Rules Derived From Lessons* once it repeats.

---

## Open Blockers

(None yet. Fill as blockers are encountered.)

---

## Notes

- **Task A:** installed `dotenv@17.4.2` prints a randomized console "tip" on load, including one ad for a third-party product ("⌁ auth for agents [www.vestauth.com]") unrelated to dotenv's maintainers' own domain (dotenvx.com). It's inert (just a `console.log` string, no network call, no code execution) but is unwanted marketing noise from a dependency in a data-privacy-sensitive project — worth knowing if it shows up in prod logs. Suppress with `dotenv.config({ quiet: true })` if it becomes annoying.
- **Task B:** Supabase's "Direct connection" host (`db.<ref>.supabase.co`) only resolves via IPv6 — fails with `ENOTFOUND` on networks/hosts without outbound IPv6. Use the **Session pooler** or **Transaction pooler** connection string instead (`aws-0-<region>.pooler.supabase.com`, username becomes `postgres.<project-ref>`), which supports IPv4.
- **Task C:** TASKS.md's Task C list omitted guardians/parents and grades even though MOCK_SCHOOL_DATA.md documents both and the Parent portal view is in MVP scope — added a guardian account per 2 students (siblings) and one grading period of grades per subject so all 4 portal roles (Admin/Teacher/Student/Parent) have real data to view. Idempotency achieved via `TRUNCATE ... RESTART IDENTITY CASCADE` at the top of the seed script rather than per-row upsert logic — simplest option for mock/demo data that's fully regenerated each run.
- **Task E:** Field-level AES-256 encryption (red flag §1) is deferred, not implemented — `ENCRYPTION_KEY` is only a placeholder in `.env.example`. What's actually in place today: bcrypt password hashing (done), audit logging on login (done), Supabase's provider-level encryption at rest (default, not app-controlled), and a standing "never log PII" comment in `backend/src/db.js`. Deciding which columns need application-level encryption and wiring TweetNaCl in is a real design decision, not infrastructure — treat as its own task before Phase 1 ships, not assumed done.

---

## Rules Derived From Lessons

(None yet. Promote from Open Blockers once a mistake repeats twice.)

