# The 3-File System — Two Sets

Both sets are **stack-agnostic**. Nothing inside them names a language, framework, or database.
That's deliberate: the previous version hardcoded a stack, got dropped into a repo it didn't
match, and the task list described software that didn't exist.

Instead, the files ship with **fill-in markers** and the seed prompt's first job is to fill them
from evidence — an audit for existing repos, your answers for new ones.

---

## Which set?

| Your situation | Use |
|---|---|
| Repo already exists, code already works | **Set A — `A-existing-project/`** |
| Empty folder, nothing built yet | **Set B — `B-new-project/`** |

Both work the same way: copy the three `.md` files to your project root, paste `SEED_PROMPT.md`
into VS Code Claude as your first message.

---

## The mechanism (both sets)

1. `CLAUDE.md` **§0** carries a plain-text status line that acts as a hard gate. While it reads
   `INCOMPLETE`, only the bootstrap phase is legal — no source edits, no installs, no guessing.
2. The gate is machine-checkable, so Claude can verify its own compliance:
   ```bash
   grep -n  "^\*\*BOOTSTRAP:" CLAUDE.md              # Set A
   grep -nE "^\*\*(BOOTSTRAP|INTAKE):" CLAUDE.md     # Set B
   ```
3. Separately, sections carry fill-in markers (`AUDIT:FILL` / `SETUP:FILL`), each owned by a
   named bootstrap task. Claude fills them **only** from things it read (Set A) or you said
   (Set B), then deletes them.
4. The last bootstrap task flips the gate to `COMPLETE`. Now the rulebook is true, and it stays
   static for the rest of the project.

> The gate and the markers are deliberately **two different tokens**. Using one for both makes the
> gate unsatisfiable — §0 has to mention the marker name to explain it, so a "no markers anywhere"
> check can never pass, and in Set B the later markers would re-block tasks that are supposed to
> fill them.
5. `TASKS.md` Phase 1 ships **empty on purpose**. It gets written after the bootstrap, from
   what you actually want. A roadmap written before the audit is fiction.

## What differs

|  | Set A (existing) | Set B (new) |
|---|---|---|
| Marker | `AUDIT:FILL` | `SETUP:FILL` |
| First task | Read-only repo audit | Intake interview (6 questions) |
| Source of truth | The code that's already there | Your answers |
| Verify command | Discovered from existing scripts, then run | Built in Phase 0, then run |
| Extra guardrail | §4.5 "don't break what works" | §4.5 "smallest thing that runs first" |
| Bootstrap length | 5 tasks (A–E) | 9 tasks (A–I) |

---

## Day-to-day use

After bootstrap, one word per task:

```
next
```

`CLAUDE.md` already tells Claude to re-read `LESSONS.md`, take the next unchecked `[ ]`, verify,
and report in a fixed 5-line format. That's where the token savings come from — you're not
re-explaining the workflow every turn.

---

## The two rules that do the real work

**The 3-strike stop (§4.7).** After three failed verify attempts, Claude stops, logs the verbatim
error to `LESSONS.md` under `## Open Blockers`, and asks you. Without this, a stuck agent burns
tokens inventing increasingly creative wrong fixes.

**Pass conditions.** Every task must state how you'd know it worked. If Claude can't write the
pass condition, the task isn't defined well enough to start. This is what stops `[x]` from
meaning "Claude believes it's done."

---

## Maintenance

- `CLAUDE.md` — edit rarely. It loads every turn, so every line costs tokens repeatedly. Keep it under ~150 lines.
- `TASKS.md` — changes constantly. This is the live state.
- `LESSONS.md` — append-only. Promote an entry to *Rules Derived From Lessons* once the same class of mistake happens twice.

Re-run the seed prompt from scratch only if the project changes shape enough that §1–§3 are wrong
again (a rewrite, a stack migration, a new major direction).
