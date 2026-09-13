# TASKS.md — Live Sprint Board (Dynamic)

> **Claude:** work ONLY the first unchecked `[ ]`. Verify. Then flip to `[x]`.
> ≤50 lines of change per task. If it won't fit, split into `.a` / `.b` here FIRST, then do `.a`.
> Never work ahead. Never batch. Never soften a task's wording to make it pass.
> Phase 0 runs task-to-task automatically (CLAUDE.md §4.1) — no "go" needed between B and H.

**Current task pointer:** `TASK A`
**Last verified:** _(never)_
**Verify command:** _(does not exist yet — TASK F creates it)_

---

## PHASE 0 — DEFINE & PROVE THE GATE (blocking)

*Nothing here is feature work. The point of Phase 0 is that by the end of it, one command tells
the truth about whether the project is healthy. Until that command exists AND passes, every
"done" claim afterwards is unverifiable.*

- [ ] **TASK A** — Intake interview. **No writes to any file except CLAUDE.md §1/§2.** Ask Sonny, in one message, as a numbered list:
  1. What is this project and who uses it? (one sentence)
  2. What must v1 do to count as done? What is explicitly NOT in v1?
  3. Where does it run — local / internal network / public internet / mobile?
  4. Does it handle sensitive or personal data? What kind?
  5. Stack: does he have a required stack, or should you recommend the boring reliable option for this project type and wait for his yes?
  6. Anything he already knows he wants banned or avoided?
  Then write his answers into CLAUDE.md §1 and §2, delete those two marker comments, and flip
  `**INTAKE: NOT DONE**` to `**INTAKE: DONE**`.
  **Pass condition:** §1 and §2 contain Sonny's answers in his terms, he has confirmed the stack
  in writing, and the INTAKE line reads `DONE`. Do NOT proceed on silence or a guess.

- [ ] **TASK B** — Create the minimum repo skeleton for the approved stack: root config, `.gitignore` (dependencies, build output, env files, local DB files, OS junk), and only the folders that will hold a file this week. `git init` if needed. Fill CLAUDE.md §3.
  **Pass condition:** tree matches §3 exactly, no empty speculative folders, `.gitignore` covers env + build output.

- [ ] **TASK C** — Create the dependency manifest and install **only** the dependencies approved in TASK A. Then read the real installed versions back from the lockfile and write them into CLAUDE.md §2. Once the stack is locked, check LESSONS.md's "Inherited Lessons" section against it — for each entry, state whether this project's actual stack matches the pattern it describes (e.g. does it have a database with seed/migration data? is Postgres in play with camelCase columns? will this deploy to a host with an ephemeral filesystem?). Note applicable ones; leave non-applicable ones alone.
  **Pass condition:** install completes clean, §2 lists real pinned versions (no "latest"), no unapproved package appears in the manifest, and every Inherited Lesson has been explicitly checked against this stack (not skipped).

- [ ] **TASK D** — Add lint + format config appropriate to the stack. Fill CLAUDE.md §6. Then prove both directions: run the linter on clean code (must exit 0), then on a throwaway file containing a deliberate violation (must exit non-zero). Delete the throwaway file.
  **Pass condition:** both the pass AND the fail case demonstrated with real output. A linter that never fails is decoration.

- [ ] **TASK E** — Add the test runner and exactly ONE trivial passing test (assert a pure helper returns a known value). Nothing more.
  **Pass condition:** the runner discovers and passes 1 test, shown in real output.

- [ ] **TASK F** — Define the single `verify` script that chains the checks from D and E plus the build, shortest-feedback-first. Run it. Fill CLAUDE.md §4.6 with the exact command.
  **Pass condition:** the chained command has been executed and exits 0, with real output pasted. This is the gate every later task must pass. If it is not green here, do not continue — fix it or ask.

- [ ] **TASK G** — Add `.env.example` listing every variable the project will need, placeholder values only. Confirm and record the build tool's client-exposure prefix rule in LESSONS.md. Then verify no real secret has ever reached git — check the current working tree (`git status`) AND, if this repo has any prior commits, its full history (`git log --all -p` grepped for key-shaped patterns) — not just that `.env` is gitignored going forward.
  **Pass condition:** no real secret in the repo (working tree or history), `.env` is gitignored, and the prefix rule is written down.

- [ ] **TASK H** — Build the thinnest end-to-end slice that actually runs: one entry point rendering or responding with one real thing, wired the way real features will be wired. No styling, no polish, no second feature.
  **Pass condition:** it runs, `verify` passes, and Sonny can see it work.

- [ ] **TASK I** — With Sonny, write the real v1 roadmap into Phase 1 below as micro-tasks per the
  rules at the bottom of this file. Ask; do not assume. If TASK C confirmed an Inherited Lesson
  applies and CLAUDE.md §5 doesn't yet have working code behind it (e.g. a database exists but has
  no backup/restore path yet), propose it as an early Phase 1 task and let Sonny confirm or
  decline it — don't silently add it, and don't silently drop it either. Then flip CLAUDE.md §0
  from `**BOOTSTRAP: INCOMPLETE**` to `**BOOTSTRAP: COMPLETE**`.
  **Pass condition:** Sonny has confirmed the list, every task states its own pass condition, this
  returns nothing —
  ```bash
  grep -n "<!-- SETUP:FILL" CLAUDE.md
  ```
  — and the gate line reads `COMPLETE`. Do not flip the gate while any marker remains or while
  the verify command from TASK F is not green.

---

## PHASE 1 — v1 FEATURE WORK

<!-- Empty on purpose. TASK I fills this in from what Sonny actually wants, AFTER the gate is
     green and one slice runs. A roadmap written before the foundation exists is fiction. -->

- [ ] _(to be defined in TASK I)_

---

## Backlog — DO NOT START

Anything here is out of scope until Sonny moves it up.

- Anything listed as "explicitly NOT in v1" in CLAUDE.md §1
- Deployment, CI/CD, monitoring — until v1 runs locally (CLAUDE.md §5 → Deployment still applies
  the day this moves up; it's written now so it's followed correctly then, not built for early)
- Performance optimisation — until something measurably needs it
- Auth, payments, or any third-party integration not in the §2 stack
- Additional dependencies, frameworks, or architectural layers

---

## How to write a task

One line. Imperative. Names the exact file(s). ≤50 lines of change. States its own pass condition.

**If you cannot write the pass condition, the task is not defined well enough to start.**

Good: `Add a 300ms debounce to the search input in src/components/SearchBar.jsx. Pass: typing 5 characters fires one request, not five.`

Bad: `Improve search performance.`
