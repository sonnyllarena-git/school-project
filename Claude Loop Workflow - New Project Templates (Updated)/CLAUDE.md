# CLAUDE.md — Project Rulebook (Static)

> Read order every session: **CLAUDE.md → LESSONS.md → TASKS.md**.
> CLAUDE.md = the law. LESSONS.md = mistakes already paid for. TASKS.md = what to do right now.

---

## §0 SETUP GATE — READ THIS FIRST

**BOOTSTRAP: INCOMPLETE**
**INTAKE: NOT DONE**

Those two status lines are the gate. Check them before anything else:
```bash
grep -nE "^\*\*(BOOTSTRAP|INTAKE):" CLAUDE.md
```

- `INTAKE: NOT DONE` → the project is undefined. The ONLY permitted work is **TASK A** (the
  intake interview). You may NOT scaffold, create files, or install anything. You may NOT pick a
  stack for me — recommend one and wait for my answer. Only TASK A may flip this to `DONE`, and
  only after I have answered in writing.
- `INTAKE: DONE` + `BOOTSTRAP: INCOMPLETE` → you may work **Phase 0** in TASKS.md (tasks B–I), in
  order, automatically (see §4.1 — no need to wait for "go" between them). No feature work.
- `BOOTSTRAP: COMPLETE` → normal execution rules (§4) apply. Only TASK I may flip this, and only
  once the verify command in §4.6 has actually been run green.

Sections below carry `SETUP:FILL` markers. Each is owned by a specific Phase 0 task, so markers
surviving into TASK B–F is expected and does **not** re-block you — the two status lines above
are the only gate.

**A rulebook filled with your assumptions is worse than an empty one**, because I will trust it
and so will you. Every line below must come from something I explicitly told you, or from a
command you actually ran.

---

## §1 PROJECT

<!-- SETUP:FILL — from Sonny's answers in TASK A. His words, not your interpretation. -->
- **Name:** `<project name>`
- **What it is:** `<one sentence — what this software does, for whom>`
- **Who uses it:** `<internal team / public users / just me>`
- **Where it runs:** `<local only / internal network / public internet / app store>`
- **Handles sensitive data?** `<yes: what kind / no>` ← drives how strict §5 Security must be
- **Definition of done for v1:** `<one sentence a non-engineer could verify>`
- **Explicitly NOT in v1:** `<the things we are deliberately not building yet>`

---

## §2 STACK (chosen once, then locked)

<!-- SETUP:FILL — only what Sonny approved in TASK A, with the versions actually installed
     in TASK C. Delete rows that don't apply. Write "none" where there is none. -->

| Layer | Choice | Version | Why (one line) |
|---|---|---|---|
| Runtime / language |  |  |  |
| Framework |  |  |  |
| Build tool |  |  |  |
| Styling |  |  |  |
| State / data |  |  |  |
| Backend |  |  |  |
| Database |  |  |  |
| Auth |  |  |  |
| Tests |  |  |  |
| Lint / format |  |  |  |
| Deployment host |  |  |  |

**Record real installed versions, not the versions you intended.** After install, read them back
from the lockfile or manifest. "latest" is not a version — pin what actually landed.

**Banned without Sonny's explicit approval:**
- Any dependency not listed above.
- Any additional architectural layer (a backend, a DB, an ORM, a state library, a UI kit).
- Swapping a locked choice for one you prefer.
- Upgrading anything mid-sprint.

If a task appears to require one of the above → **stop and ask.**
Prefer the boring, well-documented option over the clever one. You will be debugging it later.

---

## §3 DIRECTORY & NAMING CONVENTIONS

<!-- SETUP:FILL — decided in TASK B, kept minimal. Add a folder when a second file needs it,
     never in anticipation. Deep empty trees are a cost, not organisation. -->

```
<real tree — as built, not as imagined>
```

- **File naming:** `<one rule, applied consistently>`
- **Where each kind of code goes:** `<data access / logic / presentation / pure helpers>`
- **Import style:** `<relative or alias — and the real alias if configured>`
- **Test file location:** `<beside source / dedicated folder>`

---

## §4 EXECUTION RULES (non-negotiable)

1. **One task at a time, and don't wait for a "go" between them.** Work the first unchecked `[ ]`
   in TASKS.md, verify it, report it, then move straight to the next one — Phase 0 (TASK B onward)
   and any later Phase run back-to-back without a confirmation keystroke in between. Never look
   ahead, never batch, never "while I'm here" refactor. Stop mid-sequence only when: a task's own
   pass condition genuinely needs my input (TASK A's answers, TASK I's roadmap), a verify command
   fails 3 times (§4.7), or the task needs a decision outside the approved stack/scope (§2). If I
   want to review each step before you continue, I'll say so explicitly — that's an override, not
   the default.
2. **Read LESSONS.md before writing code, every session.** If an entry applies, name it in one line, then comply. This includes the "Inherited Lessons" section — those are pre-loaded from prior projects and need checking against this repo's actual stack, not just the entries this repo has generated itself.
3. **Announce in one line before editing:** `TASK <id> → <files I will touch>`. No essays.
4. **≤50 lines of new/changed code per task.** If it needs more, split it into `<id>.a`, `<id>.b` in TASKS.md first, then do only `.a`.
5. **Build the smallest thing that runs, then grow it.** A working vertical slice beats a complete layer that has never executed. Never write the second file of a pattern before the first one runs.
6. **Verify after every task.** Run:
   ```bash
   <!-- SETUP:FILL — the real command, confirmed green in TASK F. Never invented. -->
   ```
7. **Self-correct loop.** On failure:
   - Read the actual error text. Do not guess from the symptom.
   - Fix the root cause. Never silence an error by suppressing it (ignore-comments, disabled lint rules, loosened types, deleted assertions, skipped tests).
   - Re-run the verify command.
   - **After 3 failed attempts: STOP.** Append the verbatim error to LESSONS.md under `## Open Blockers` and ask Sonny. Do not keep trying variations.
8. **Then and only then:** flip `[ ]` → `[x]` in TASKS.md, update the pointer lines, and append a one-line LESSONS.md entry if anything surprised you.
9. **Never touch:** `.env` or any real secret, CI/CD config, or anything outside the current task's stated scope. `.env.example` with placeholders only.
10. **Closing report — exactly this, nothing after it:**
    ```
    TASK <id> ✅
    Files: <paths>
    Verify: <command> → PASS
    Lesson: <one line, or "none">
    Next: TASK <id+1> — <title>
    ```

---

## §5 ENGINEERING PRINCIPLES

Apply every principle that is meaningful for the stack in §2. Skip what doesn't apply — a static
site has no SQL rules. Never invent a requirement the stack cannot support.

### Security
- No secret, token, key, or connection string in the repo. Ever. Read from environment, validate at startup, fail loudly if absent.
- **Know which env vars ship to the client.** Most frontend build tools inline prefixed vars into the public bundle — a "secret" there is readable by anyone. Confirm the prefix rule for your build tool in TASK C and record it in LESSONS.md immediately.
- Validate all external input at the boundary it enters. Reject unknown fields.
- Parameterise every database query. String-concatenated queries are a defect, always.
- Authorise on the server for every protected action. A hidden UI control is not a permission check.
- Never log credentials, tokens, or personal data.
- Errors shown to users are generic; detail goes to logs.
- Get this right on day one. Retrofitting security into a working app is how leaks happen.
- Before any commit that touches config, env handling, or a new integration, verify no secret has
  ever reached git — check the current working tree AND full history (e.g. `git log --all -p`
  grepped for key-shaped patterns), not just `git status`. A `.gitignore` rule added today does not
  remove a secret a past commit already shipped.

### Performance
- Correct first, then measured, then fast. Do not optimise on a hunch.
- No N+1 access patterns. Batch or join instead of looping.
- Paginate or virtualise anything unbounded from the very first list you build.
- Index what you filter and join on, in the same task that adds the query.
- Don't allocate inside a hot path (render loop, request handler, tight iteration).
- Release what you acquire: connections, listeners, timers, subscriptions, GPU resources.

### Architecture
- Separate presentation, logic, and data access from the first file. Retrofitting this is expensive.
- Dependencies point one way only. If A imports B, B never imports A.
- Business logic must be testable without its transport layer.
- One source of truth per concept. Duplicated shapes that can disagree are bugs waiting.
- Small units: functions under ~40 lines, files under ~250. Over that, split.
- Delete dead code immediately. No commented-out blocks left behind.
- Don't build for a scale or a feature you don't have yet.
- If frontend and backend run as separate local processes, add one combined start script (don't
  make "forgot to start the backend" indistinguishable from "the data is actually empty" — see the
  QA/Testing bullet below).

### Data & Persistence
*Skip this whole subsection if §2 shows no database.*
- If this project has one-time seed/migration data (a `schema_version`-style table, or any "run
  once, insert seed/mock data" pattern): every migration step that seeds/inserts data must log a
  clear warning if it ever runs again — it should fire once, ever, per database. Pure schema-only
  migrations (`ALTER TABLE ADD COLUMN`, etc.) don't need this; they're harmless to rerun. A
  migration cannot tell "genuine first install" apart from "this database was just wiped" from
  the inside — the warning is the only thing that makes a reset visible instead of silent.
- Snapshot the database's content tables to a local, gitignored file on every successful server
  startup, and provide one deliberate, confirm-before-running restore command. Never restore
  automatically on startup — that could silently overwrite data intentionally cleared for local
  testing. This turns "the local database got wiped" into a one-command fix instead of a
  permanent loss.
- Migrations run in order and never mutate a version once it has shipped — add a new version to
  fix a mistake, never edit an old one.
- If using Postgres (or any other case-folding database) with camelCase column or variable names
  in application code: unquoted identifiers get folded to lowercase on both `CREATE` and every
  query. Confirm early whether the chosen database preserves case, and either quote every
  camelCase identifier consistently (`AS "exactCamelCase"`) or write code that expects lowercase
  keys back. Getting this wrong reads as `undefined` values, not an error — it will not show up
  until something actually reads the field.

### Deployment
*Dormant until Sonny actually deploys — TASKS.md's Backlog defers this out of v1 on purpose. Read
this now so the day deployment starts, it's done right the first time, not built for in advance.*
- A local `.env` never reaches the host automatically. Any `process.env.*` a feature reads must
  also be added, by hand, to the hosting platform's own environment/config panel — pushing the
  code is not enough. This fails silently as "works fine locally, 500s in production."
- Know whether the host's filesystem is ephemeral (wiped on restart/redeploy) or persistent.
  Anything a user uploads (files, images, media) needs real object storage (S3-compatible or
  similar) if the filesystem resets — local-disk upload storage that felt fine in local dev can
  quietly lose every upload the first time production restarts.
- The Data & Persistence seed-migration risk above applies doubly in production. A managed
  database is often backed up by the host, but confirm this explicitly rather than assuming it.

### QA / Testing
- The verify command must be genuinely green before any feature work begins (TASK F). A gate that has never passed is not a gate.
- Every unit of logic gets one happy-path and one failure-path test.
- Bug fixed = failing test written first, then the fix. The test is the proof.
- Never mark a task complete with a failing or skipped check.
- No debug logging left in committed code.
- Before treating a "my data disappeared" report as real data loss, verify at the data layer
  directly — a live DB query or an authenticated API call — before proposing a fix. The same
  symptom can mean an empty table, a silently re-run seed migration, or a backend process that
  simply isn't running; diagnosing from the symptom alone risks fixing the wrong thing.

---

## §6 STYLE

<!-- SETUP:FILL — decide once in TASK D, then never debate it again. Let the formatter win. -->
- **Formatter:** `<tool, or "none">` — if one exists, it decides all formatting. Do not hand-format.
- **Quotes / semicolons / line width:** `<or "formatter decides">`
- **Export style:** `<named / default>` — pick one, apply everywhere
- **Async style:** `<async-await preferred>`

Universal regardless of stack:
- Comment **why**, never **what**.
- Name things for what they mean, not what they are (`retryCount`, not `num`).
- No clever one-liners that need a comment to explain.

---

## §7 TOKEN DISCIPLINE

- Read only files the current task needs. Never scan the tree "for context".
- Prefer targeted edits over rewriting whole files.
- Don't paste file contents back to Sonny — he can open them.
- No preamble, no announcing intentions, no recapping these rules. Use the report format in §4.10.
- If more than one Claude session might be working in this repo at once (parallel terminal
  windows, teammates, a background agent), re-`Read` TASKS.md and LESSONS.md immediately before
  editing them rather than trusting an earlier-in-conversation view, and verify a write actually
  landed (re-read or grep) rather than assuming it did — a concurrent write can silently overwrite
  yours. Never edit a section describing another session's own in-progress work.
