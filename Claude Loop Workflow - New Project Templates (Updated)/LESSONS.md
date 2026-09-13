# LESSONS.md — Bug Memory (Dynamic)

> **Claude: read this file BEFORE writing any code, every session.**
> Purpose: never make the same mistake twice.
>
> **Format — one line, no paragraphs:**
> `- [YYYY-MM-DD] <what happened / what I assumed> → <rule to follow from now on>`
>
> **Append an entry when:** a verify run failed · a fix took more than one attempt · a tool or
> library behaved differently than expected · an environment or version quirk cost time · you
> were about to repeat something already logged here · a setup step had a non-obvious prerequisite.
>
> **Do NOT log:** task completions · routine successes · anything already stated in CLAUDE.md ·
> anything longer than one line (if it needs a paragraph, it belongs in `/docs`).

This file starts empty except for the section below. That is correct — a new project has no
scars yet of its own. It will fill up fast during Phase 0, because scaffolding is where most
version and config surprises live. Log them there and you stop paying for them twice.

---

## Inherited Lessons (Carried Forward From Prior Projects)

*Pre-loaded, not discovered in this repo. These came from real incidents in other projects built
the same way. During Phase 0 (TASK C, once the stack is locked), check whether each one actually
applies to THIS project's stack — if it does, note it as confirmed-applicable below and make sure
CLAUDE.md §5 already covers it; if this project has no matching pattern (e.g. no database at all),
leave the entry alone and move on. Do not invent an incident here to justify keeping one — and do
not delete these on the assumption they don't apply without checking first.*

- [inherited] A database with one-time seed/migration data cannot tell "genuine first install"
  apart from "this database was just wiped" — both look identical from inside the migration. If
  this project has that pattern, it needs a warning log on every data-seeding migration step, plus
  a startup backup + one-command manual restore. See CLAUDE.md §5 → Data & Persistence.
- [inherited] "My data disappeared" reports must be verified at the data layer (a direct DB query
  or an authenticated API call) before being treated as real data loss — the same symptom can mean
  an empty table, a silently re-run seed migration, or a backend process that simply isn't running.
- [inherited] A local `.env` never reaches a deployment host automatically — any new
  `process.env.*` a feature needs must also be added, by hand, to the host's own environment/config
  panel, or the feature works locally and 500s in production with no obvious cause. See CLAUDE.md
  §5 → Deployment.
- [inherited] If the database is Postgres (or any other case-folding engine) and the app code uses
  camelCase field names, unquoted identifiers get folded to lowercase on both create and query —
  this reads back as `undefined`, not an error, and stays invisible until something actually needs
  the field. See CLAUDE.md §5 → Data & Persistence.
- [inherited] If more than one Claude session (or teammate) might touch this repo's shared files
  (TASKS.md, LESSONS.md) at the same time, a write can silently get overwritten by a concurrent
  one. Re-`Read` before editing shared files, and verify a write landed rather than assuming it
  did. See CLAUDE.md §7.

---

## Open Blockers

*Unresolved after 3 self-correction attempts (CLAUDE.md §4.7). Claude STOPS here and asks Sonny.*
*Paste the verbatim error, not a summary of it.*

- _(none)_

---

## Setup & Versions

*Install failures, peer-dependency conflicts, version mismatches, config-file format changes,
package-manager quirks. Phase 0 lives here.*

- _(none yet)_

<!-- SHAPE REFERENCE — delete this comment block once real entries exist:
- [YYYY-MM-DD] Tool's docs showed the old config filename; the installed major version had replaced it → check the installed version's own docs, not the first search result.
- [YYYY-MM-DD] Linter passed because its config silently ignored the source folder → always prove a linter fails on a deliberate violation before trusting it.
-->

---

## Build & Tooling

*Build tool, bundler, dev server, lint, format, test runner, env vars, scripts.*

- _(none yet)_

---

## Language & Type Errors

*Recurring compile, type, import, or module-resolution traps.*

- _(none yet)_

---

## Framework & Runtime

*Framework-specific behaviour that bit us: lifecycle, state, rendering, routing, request handling.*

- _(none yet)_

---

## Data & Persistence

*Queries, migrations, transactions, caching, serialisation. Delete this section if there is no data layer.*

- _(none yet)_

---

## Security & Secrets

*Env-var exposure rules, key handling, anything that could have leaked. Log the rule the moment
you learn it, not after it bites.*

- _(none yet — TASK G populates the client-exposure prefix rule for this build tool)_

---

## Rules Derived From Lessons

*Promote an entry here once the same class of mistake has happened twice.*
*Entries here are as binding as CLAUDE.md.*

- _(none yet)_
