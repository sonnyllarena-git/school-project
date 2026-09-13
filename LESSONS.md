# Lessons Learned

This file logs discoveries, blockers, and rules that emerged during development.

Append new entries as they occur. Promote a pattern to *Rules Derived From Lessons* once it repeats.

---

## Open Blockers

(None yet. Fill as blockers are encountered.)

---

## Notes

- **Task A:** installed `dotenv@17.4.2` prints a randomized console "tip" on load, including one ad for a third-party product ("⌁ auth for agents [www.vestauth.com]") unrelated to dotenv's maintainers' own domain (dotenvx.com). It's inert (just a `console.log` string, no network call, no code execution) but is unwanted marketing noise from a dependency in a data-privacy-sensitive project — worth knowing if it shows up in prod logs. Suppress with `dotenv.config({ quiet: true })` if it becomes annoying.

---

## Rules Derived From Lessons

(None yet. Promote from Open Blockers once a mistake repeats twice.)

