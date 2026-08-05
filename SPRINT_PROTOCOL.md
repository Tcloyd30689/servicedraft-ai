# SPRINT PROTOCOL — Master Update Batch (updates-2026-08)

This file governs **every sprint in this batch**. Read it at the start of each sprint,
before doing anything else. It sits alongside `CLAUDE_CODE_BUILD_INSTRUCTIONS.md`,
which remains in force — where the two overlap, the stricter rule wins.

---

## SECTION 1 — WORKSPACE GUARD

**Run this before anything else, every sprint. No exceptions.**

1. Run:
   ```bash
   git branch --show-current
   ```
   It must print exactly: `updates-2026-08`

2. Run:
   ```bash
   git rev-parse --show-toplevel
   ```
   The path must end in `servicedraft-ai-updates`

If **either** check fails — especially if the branch is `main` — **HARD STOP** and output
exactly this line, then do nothing else:

```
WRONG WORKSPACE — open Claude Code in the servicedraft-ai-updates folder, not the live folder.
```

Do not "fix it by checking out the branch." Do not proceed with any task. Stop.

---

## SECTION 2 — SEQUENCE GUARD

Each sprint prompt names a **REQUIRED PREDECESSOR MARKER** — an exact string that the
previous sprint wrote into `BUILD_PROGRESS_TRACKER.md`.

- Grep `BUILD_PROGRESS_TRACKER.md` for **that exact string only**.
- **Never read the rest of the file.** It is large and burns context for no benefit.

```bash
grep -c "<REQUIRED PREDECESSOR MARKER>" BUILD_PROGRESS_TRACKER.md
```

If the marker is missing (count `0`): **HARD STOP** and report which sprint must run first.
Do not attempt to run the missing sprint yourself and do not proceed out of order.

---

## SECTION 3 — HARD SAFETY RULES

**Non-negotiable. Restate this entire section verbatim in every subagent brief.**

- **NEVER modify** `src/hooks/useAuth.ts`, `src/middleware.ts`, `src/app/api/me/**`,
  any Stripe code, or any auth / session / signup / cookie logic.
- **NEVER touch RLS policies.**
- **NEVER run database migrations or any SQL against Supabase.** Every schema change for
  this batch is **ALREADY applied in production**.
- **NEVER delete** files, routes, columns, or data. **Additive, non-destructive edits only.**
- **NEVER `git push`.**
- **NEVER checkout, merge, rebase, or reset `main`.** All commits stay local on
  `updates-2026-08`.

If a task appears to require breaking any of these rules: **STOP and report instead.**

---

## SECTION 4 — TEAM MODEL (dynamic workflow, every sprint)

The **main session is the ORCHESTRATOR**. It plans, delegates, integrates, and is the
**only one that commits**.

Subagents are **one level deep and stateless**. Every brief must be fully self-contained:
the task, the exact files, the return contract, what not to touch, plus the Section 3
rules restated in full.

### SCOUTS — read-only exploration

- Run **in parallel**, each scoped to named files.
- Return: the **current state versus the sprint's assumptions**, exact function/section
  anchors, and **any existing feature the sprint did not mention** — report it, **never
  remove it**.
- The repo evolves between sprints. Scouts are how each sprint adapts to what is actually
  there instead of what the prompt assumed.

### BUILDERS — implementation

- **One job each**, named files only.
- **Parallelize builders ONLY when their file sets do not overlap.**

### QA-VISION VERIFIER — mandatory final tier before any commit

One subagent that performs the following **in order**:

- **(a)** Run `npx tsc --noEmit` and `npm run build`. **Zero errors required.**
- **(b)** Start the dev server: `npm run dev -- -p 3011`
- **(c)** Smoke-check the sprint's key routes over HTTP — status codes and obvious error text.
- **(d)** If `scripts/qa-shot.mjs` and Playwright are available, capture full-page
  screenshots of the sprint's touched screens into `qa-screens/` — **including logged-in
  screens** when `TEST_ACCOUNT_EMAIL` and `TEST_ACCOUNT_PASSWORD` exist in `.env.local` —
  then **READ the screenshots** and visually inspect them against the sprint's definition
  of done (layout, theming, obvious breakage).
- **(e)** Adversarially review the **full git diff** against the sprint contract, hunting
  for omissions and regressions.
- **(f)** **Directly fix small issues** it finds (typos, styling, obvious one-file bugs).
  Return **structural problems** to the orchestrator for reassignment.
- **(g)** Kill the dev server.

The orchestrator loops **build → verify** until the verifier reports clean.

---

## SECTION 5 — WRAP-UP

**Every sprint, only after QA passes:**

1. **Bump the PATCH version** from its current value in **BOTH** `src/lib/version.ts` and
   `package.json` — unless the sprint prompt says minor.
   (`version.ts` keeps the `v` prefix and `-beta` suffix; `package.json` strips both.)
2. **Append a completed entry to the END of `BUILD_PROGRESS_TRACKER.md`** whose first line
   begins exactly:
   ```
   Sprint <ID> — <Title>
   ```
3. Make **ONE local commit** with a descriptive message.
4. **Report back:**
   - files changed
   - QA results, **including which screenshots were reviewed**
   - deviations and why
   - discoveries worth knowing

**DO NOT push.**

---

## SECTION 6 — CONTEXT DISCIPLINE

The orchestrator **never bulk-reads large files it has scout summaries for**. Heavy reading
happens **inside subagents**, so the main context stays clean for integration and judgment.
