# Operating Workflow — REX Repository

> This file defines how agents execute tasks safely in this repo — solo or in coordination.
> All workflows are model-agnostic. Platform-specific notes are marked [CLAUDE], [CODEX], [GEMINI].

---

## Standard Task Lifecycle

```
INTAKE → INSPECT → PLAN → IMPLEMENT → VERIFY → HANDOFF
```

Every task must pass through each stage. Skipping is only allowed for trivial single-file fixes.

---

## Stage 1: Task Intake

**Goal:** Understand the task fully before touching any file.

Steps:
1. Read the task description carefully
2. Identify which domain(s) are involved
3. Read `AGENT.md` relevant sections for those domains
4. Read relevant skill file(s) from `/.agent/skills/`
5. Identify which hooks apply
6. Determine: is this a single-agent task or does it need subagent delegation?

**Escalate to architect if:**
- Task crosses 3+ domains
- Task changes auth or payment flows
- Task involves schema changes to tables with existing data
- Task is ambiguous about product behavior (not implementation)

---

## Stage 2: Inspect Before Editing

**Rule: Never guess current file state. Always read.**

```
For every file you plan to edit:
  1. Read it first (use view_file or equivalent)
  2. Note current patterns, existing functions, current imports
  3. Identify what already exists vs what needs to be added
  4. Check for existing similar patterns to follow
```

Inspect sequence for backend tasks:
```
1. Read routes/routes.ts (current endpoints)
2. Read relevant controller
3. Read relevant service (if exists)
4. Read domain/schema/ files (current DB shape)
5. Read middleware (current auth/validation setup)
```

Inspect sequence for frontend tasks:
```
1. Read app/ route structure
2. Read relevant page.tsx
3. Read relevant components
4. Read lib/api/ (current API client)
5. Read hooks/ (existing hooks)
6. Read type/ definitions
```

---

## Stage 3: Planning

**Planning is MANDATORY for:**
- Any change touching 3+ files
- Any new API endpoint
- Any schema change
- Any new page or route
- Any change to auth middleware
- Any migration of existing data

**Standard Plan Format:**
```markdown
## Plan: [task name]

**Domain(s):** [list]
**Subagent(s) needed:** [list or "single agent"]
**Files to create:** [list]
**Files to modify:** [list]
**Files to read (not modify):** [list]

**Assumptions:**
- [assumption 1]
- [assumption 2]

**Implementation sequence:**
1. [step 1 — what and why this order]
2. [step 2]
3. [step 3]

**Risks:**
- [risk 1] → mitigation: [mitigation]

**Migration required:** yes/no
**Hooks applicable:** [list]
**Definition of done:** [specific to this task]
```

---

## Stage 4: Implementation

**Rules during implementation:**
- Implement in the sequence defined in the plan
- After each file is written, verify it matches plan assumptions
- If an assumption is wrong, update the plan before continuing
- Do not implement more than what the plan specifies (scope creep = quality risk)
- For backend: schema → repository → service → controller → route (this order)
- For frontend: type → API client → hook → component → page (this order)

**When assumptions prove wrong:**
```
1. Stop
2. Document the new information
3. Update plan
4. If plan change is major → re-run Stage 3
5. Continue with updated plan
```

---

## Stage 5: Verification

Run after implementation, before handoff.

**Hook Self-Check** (from `/.agent/hooks/HOOKS.md`):
```
architecture-drift → check
api-contract       → check
db-migration       → check (if schema changed)
frontend-route     → check (if new pages)
social-boundary    → check (if social features)
unsafe-data-access → check
plan-completeness  → check (retrospectively)
moderation-coverage → check (if UGC)
```

**Definition of Done Check** (from AGENT.md §14):
```
All conventions followed → ✅/❌
Hooks passed → ✅/❌
Loading/empty/error states → ✅/❌/NA
Rate limiting considered → ✅/❌/NA
Moderation path → ✅/❌/NA
No new lint errors → ✅/❌
Migration documented → ✅/❌/NA
Change summary produced → ✅/❌
```

---

## Stage 6: Handoff

Use the standard handoff template from `/.agent/subagents/ROLES.md`.

Minimum handoff content:
- Files changed
- Assumptions that held true / were wrong
- Risks that materialized
- What the next role or person needs to do
- What must NOT be changed in follow-on work

---

## Multi-Agent Coordination Workflow

### When to Split Work

| Condition | Split? | How |
|---|---|---|
| Backend + frontend in same PR | YES | schema-designer + backend-builder + frontend-builder sequence |
| Schema + service + controller | YES | schema-designer → backend-builder |
| Multi-domain social feature | YES | social-feature-planner → architect → implementers |
| Single domain, <5 files | NO | Single agent |

### Coordination Rules
1. **schema-designer always completes before backend-builder starts** on schema-dependent work
2. **backend-builder defines API contract before frontend-builder starts** on new endpoints
3. **auth-guardian reviews any change to middleware or profile resolution** before merge
4. **moderation-guardian reviews any UGC feature** before it ships
5. **release-reviewer is the final gate** — no exceptions

### Avoiding Conflicting Edits
- Each subagent works only in their defined scope (see ROLES.md)
- When two agents need to touch the same file: architect arbitrates, one agent goes first, second reviews output
- Lock files while in progress: include file name in plan header to signal ownership
- Never edit the same Drizzle schema file in parallel

---

## Refactor Workflow

Use when restructuring existing code without changing behavior.

```
1. READ all files involved in refactor
2. Write REFACTOR PLAN documenting:
   - Current state (exact)
   - Target state (exact)
   - What behavior is preserved
   - What changes only structurally
   - Sequence of moves
3. Get architect approval if cross-domain
4. Implement in atomic steps (each step = repo still works)
5. Verify no behavioral change
6. Run hooks
7. Handoff with "preserved behavior" confirmation
```

**Refactor safety rules:**
- Never rename a file and change its logic in the same commit
- Never move a function and modify it at the same destination
- Preserve existing patterns for existing features during migration

---

## Migration Workflow

Use when evolving schema or data alongside code.

```
1. migration-coordinator produces migration plan
2. schema-designer produces schema changes
3. architect reviews plan
4. migration-coordinator writes backfill script (if needed)
5. Test migration on clean DB
6. backend-builder updates services/repositories for new schema
7. Verify old endpoints still work (backward compat check)
8. Ship schema migration + code change together
9. Run backfill script post-deploy
10. Verify counters with reconciliation job
```

**Migration sequencing principle:**
Always maintain a stable intermediate state. Never leave the codebase in a broken state between migration steps.

---

## Assumption Format

When an agent makes an assumption, it must be stated explicitly:

```
ASSUMPTION: [what I am assuming]
BASIS: [why I believe this is true]
RISK IF WRONG: [what breaks if this assumption is incorrect]
VERIFICATION: [how this can be confirmed]
```

---

## Change Summary Format

At end of every task:

```markdown
## Change Summary: [feature/fix name]

**Scope:** [files changed]
**Type:** feature / bugfix / refactor / migration / docs
**Domain(s):** [list]

### What Changed
[concise description]

### Why
[rationale]

### Architecture Compliance
[how this follows AGENT.md rules — or explicit deviation with justification]

### Hooks
[which hooks were checked and their results]

### Risks Introduced
[new risks this change creates, or "none"]

### Follow-on Work
[what still needs to be done]
```
