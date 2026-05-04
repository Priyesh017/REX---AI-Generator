# Hooks & Quality Gates — REX Repository

> **Policy-first.** Every hook here is a mandatory policy readable by any AI agent.
> Optional executable scripts are noted per hook.
> Agents must self-check these gates before completing work.

---

## How to Use This File

1. Before completing any task, identify which hooks apply
2. Run each applicable hook mentally (or via script if available)
3. If any hook FAILS → fix issue before proceeding
4. Include hook pass/fail status in your change summary

---

## Hook 1: `architecture-drift`

**Trigger:** Before any edit touching 3+ files or crossing domain boundaries
**Blocking:** YES

### Checks
- [ ] Does the change respect the controller → service → repository layering?
- [ ] Does any new code put business logic in a controller?
- [ ] Does any new code put a DB query in a controller or route?
- [ ] Does any new code put a Supabase query in a component?
- [ ] Does the change blur the `generated_images` ↔ `posts` boundary?
- [ ] Is `clerk_user_id` being used as a relational FK anywhere new?
- [ ] Is the new file placed in the correct domain folder?

### Failure Conditions
- Business logic found in `controllers/`
- DB access found outside `repositories/`
- `clerk_user_id` used as FK in social tables
- `generated_images` and `posts` treated as same entity

### Agent Behavior on Failure
STOP. Restructure the implementation to comply. Do not proceed past this gate.

### Example Check
```
Checking architecture-drift for: "add post likes"

✅ like logic lives in services/social.service.ts
✅ DB write in repositories/social.repository.ts
✅ controller calls service, sends response only
✅ uses profiles.id (UUID), not clerk_user_id
✅ generated_images not touched
→ PASS
```

---

## Hook 2: `api-contract`

**Trigger:** Before implementing any new API endpoint
**Blocking:** YES

### Checks
- [ ] Is the endpoint documented with: method, path, auth requirement, payload, response shape?
- [ ] Is request body validated with Zod schema in `validation/`?
- [ ] Does the response match the standard shape `{ data: T }` or `{ error, code }`?
- [ ] Is the auth requirement explicit (public / requireAuth / requireRole)?
- [ ] Is rate limiting applied if this is a mutating endpoint?
- [ ] Is the frontend consumer of this endpoint defined or planned?

### Failure Conditions
- Endpoint missing Zod validation
- Response shape inconsistent with standard
- Mutating endpoint without rate limit consideration
- No documentation of what this endpoint does

### Agent Behavior on Failure
Document the endpoint contract first. Create the Zod schema. Then implement.

### Example Check
```
Checking api-contract for: POST /posts/:id/like

✅ method: POST, path: /posts/:id/like
✅ auth: requireAuth
✅ payload: none (postId from params)
✅ response: { data: { liked: boolean, likesCount: number } }
✅ Zod: postIdSchema validates UUID param
✅ rate limit: 60 likes/minute/user (advisory)
✅ consumer: LikeButton.tsx via useLikePost hook
→ PASS
```

---

## Hook 3: `db-migration`

**Trigger:** Before any schema change (new table, new column, dropped column, index change)
**Blocking:** YES

### Checks
- [ ] Is there a named migration file for this change?
- [ ] Does the migration document: what changed, why, rollback path?
- [ ] Does the migration handle existing data (backfill if needed)?
- [ ] Are all new FK columns indexed?
- [ ] Are all new status/visibility columns constrained with CHECK?
- [ ] Does any dropped column have a grace period plan?
- [ ] Is denormalized counter ownership documented if new counters added?

### Failure Conditions
- Schema change with no migration file
- New FK column without index
- New status column without CHECK constraint
- Existing data not accounted for

### Agent Behavior on Failure
Create migration documentation first. Never apply schema changes without it.

### Migration Document Template
```markdown
## Migration: [name]
**Date:** YYYY-MM-DD
**Author:** [agent/human]

### What Changed
[describe]

### Why
[rationale]

### Affected Tables
- [table]: [change]

### Existing Data
[how existing rows are handled]

### Rollback
[how to undo]

### Indexes Added
[list]
```

---

## Hook 4: `frontend-route-placement`

**Trigger:** Before creating any new page or route
**Blocking:** YES

### Checks
- [ ] Is this page public (no auth required)? → goes in `app/(public)/`
- [ ] Is this page auth-required? → goes in `app/(auth)/`
- [ ] Is this admin-only? → goes in `app/admin/`
- [ ] Does the page have a corresponding backend endpoint?
- [ ] Is the page using Server Component where possible (SEO-relevant content)?
- [ ] Is a layout.tsx already defined for this route group?

### Failure Conditions
- Auth-required page placed outside `(auth)/` group
- New page without middleware protection
- Client-fetching page that should be server-rendered

### Agent Behavior on Failure
Correct route placement before creating the file.

---

## Hook 5: `social-domain-boundary`

**Trigger:** Before implementing any social feature (follow, like, save, comment, remix, notification)
**Blocking:** YES

### Checks
- [ ] Is ownership verified? (can only act on others' content, not own in some cases)
- [ ] Is visibility checked? (can viewer even see this resource?)
- [ ] Is rate limiting applied?
- [ ] Is a report/moderation path planned for this UGC type?
- [ ] Are denormalized counters defined for this action?
- [ ] Is the action idempotent? (re-liking doesn't duplicate, re-following errors gracefully)

### Failure Conditions
- Social action without ownership/visibility check
- UGC feature with no moderation path
- Non-idempotent toggle action

### Agent Behavior on Failure
Document ownership rules, visibility rules, and moderation path before implementing.

---

## Hook 6: `unsafe-data-access`

**Trigger:** Before writing any code that touches the database
**Blocking:** YES

### Checks
- [ ] Is DB access going through a repository function, not inline in controller/service?
- [ ] Is the query using parameterized inputs (no string interpolation)?
- [ ] Is the result scoped to the correct user where personal data is involved?
- [ ] Is the query using Drizzle ORM (not raw SQL) unless justified?
- [ ] If raw SQL is used, is it documented why?

### Failure Conditions
- Direct Supabase/DB calls in controllers or components
- Unparameterized queries
- Query returning data belonging to other users without authorization check

### Agent Behavior on Failure
Extract to repository function. Review for injection risk.

---

## Hook 7: `agent-plan-completeness`

**Trigger:** Before any task spanning 3+ files or 2+ domains
**Blocking:** YES

### Checks
- [ ] Has a plan been produced using the standard proposal format in AGENT.md §12?
- [ ] Are all affected files listed?
- [ ] Are all assumptions stated?
- [ ] Are risks identified?
- [ ] Is migration requirement stated (yes/no)?
- [ ] Is the change sequence defined (what order to implement)?

### Failure Conditions
- Starting multi-domain implementation without written plan
- Assumptions not stated
- Sequence not defined (leads to broken intermediate states)

### Agent Behavior on Failure
Produce the plan document first. Get user acknowledgment if high-risk.

---

## Hook 8: `moderation-coverage`

**Trigger:** Before shipping any feature that accepts user-generated content
**Blocking:** YES

### UGC types that trigger this hook
- Published posts
- Comments
- Profile bio/display name
- Collection names
- Tag creation

### Checks
- [ ] Is there a report endpoint for this content type?
- [ ] Is there an auto-hide threshold defined?
- [ ] Is there a moderator action path (approve/dismiss)?
- [ ] Is the audit_log written for moderator actions?
- [ ] Are banned users blocked from submitting this content?

### Failure Conditions
- New UGC feature with no report mechanism
- Moderator actions without audit trail

### Agent Behavior on Failure
Do not ship UGC feature until report/moderation path exists. It can be a basic queue at first.

---

## Hook Self-Check Template

Use this at the end of any significant task:

```markdown
## Hook Self-Check: [task name]

| Hook | Applied? | Result | Notes |
|---|---|---|---|
| architecture-drift | yes/no | PASS/FAIL/NA | |
| api-contract | yes/no | PASS/FAIL/NA | |
| db-migration | yes/no | PASS/FAIL/NA | |
| frontend-route-placement | yes/no | PASS/FAIL/NA | |
| social-domain-boundary | yes/no | PASS/FAIL/NA | |
| unsafe-data-access | yes/no | PASS/FAIL/NA | |
| agent-plan-completeness | yes/no | PASS/FAIL/NA | |
| moderation-coverage | yes/no | PASS/FAIL/NA | |
```
