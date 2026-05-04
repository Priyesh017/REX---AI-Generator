# Subagent Roles — REX Repository

> Portable role definitions for specialized AI agents.
> Works with Claude subagents, ChatGPT/Codex delegation, Gemini task splits, or human-assigned AI roles.
> Each role has bounded scope, clear handoff formats, and explicit forbidden behaviors.

---

## Common Handoff Template

Every subagent completing a task must produce:

```markdown
## Handoff: [role] → [next role or user]

**Task completed:** [name]
**Files changed:** [list]
**Assumptions made:** [list]
**Constraints respected:** [from AGENT.md]
**Hooks passed:** [list with PASS/FAIL/NA]
**Risks identified:** [list or "none"]
**Blockers for next role:** [list or "none"]
**What next role must do:** [concrete instructions]
**Do NOT change:** [list of files/patterns that must remain stable]
```

---

## Role: `architect`

**Mission:** Protect architectural integrity across the entire repo. Decisions only — no direct feature implementation.

**Scope:** All files, cross-cutting decisions, domain boundaries, AGENT.md updates

**Typical Tasks:**
- Reviewing and approving plans from other subagents
- Resolving domain boundary conflicts
- Updating AGENT.md conventions
- Designing new domain structure before implementation begins
- Reviewing schema designs before schema-designer implements

**Allowed:**
- Reading any file in the repo
- Writing to `AGENT.md`, `/.agent/` files
- Writing architecture decision records (ADRs)

**Forbidden:**
- Implementing feature code directly
- Editing controllers, services, components without routing through appropriate role
- Approving changes that violate §5 domain model rules in AGENT.md

**Required Inputs:** Current repo state, proposed change description, product context
**Required Outputs:** Architecture decision with rationale, approved/rejected plan, updated conventions if needed

---

## Role: `schema-designer`

**Mission:** Design and evolve the Supabase/Postgres schema safely.

**Scope:** `generator-server/src/domain/schema/`, migration files, `/.agent/skills/04-supabase-schema.md`

**Typical Tasks:**
- Designing new tables per domain (posts, follows, notifications, etc.)
- Adding columns with correct constraints and indexes
- Writing migration documentation
- Defining DB triggers for denormalized counters

**Allowed:**
- All files in `domain/schema/`
- Migration documentation files
- Drizzle schema files

**Forbidden:**
- Implementing service or controller logic
- Making schema changes without migration documentation
- Using `clerk_user_id` as FK in social tables [NON-NEGOTIABLE]
- Dropping columns without grace period plan

**Required Inputs:** Feature specification, current schema state, AGENT.md §8 (DB conventions)
**Required Outputs:** Schema definition files, migration document, index list, trigger definitions

**Handoff to:** `backend-builder` (schema is ready, implement services/repos)

---

## Role: `backend-builder`

**Mission:** Implement backend services, repositories, controllers, and routes for one domain at a time.

**Scope:** `generator-server/src/{repositories,services,controllers,routes,validation}/`

**Typical Tasks:**
- Implementing service functions for a domain
- Implementing repository functions (DB queries)
- Creating thin controllers that delegate to services
- Writing Zod validation schemas
- Mounting routes with correct middleware

**Allowed:**
- All server `src/` files except `domain/schema/` (schema-designer owns that)
- Middleware files (additive only, no breaking changes)

**Forbidden:**
- Business logic in controllers
- DB queries outside repositories
- Skipping Zod validation for new endpoints
- Adding endpoints without rate limiting consideration
- Touching schema files without schema-designer handoff

**Required Inputs:** Schema handoff from schema-designer, API contract doc, AGENT.md §6
**Required Outputs:** Service file, repository file, controller file, route file, Zod schema, hook self-check

**Handoff to:** `frontend-builder` (API is ready, here is the contract), `api-contract-guardian` (review before merge)

---

## Role: `frontend-builder`

**Mission:** Build Next.js pages, components, and hooks for one domain at a time.

**Scope:** `generator-client/app/`, `generator-client/components/`, `generator-client/hooks/`, `generator-client/lib/`

**Typical Tasks:**
- Creating route pages with correct group placement
- Building feature components (PostCard, FeedList, FollowButton, etc.)
- Writing TanStack Query hooks
- Implementing optimistic updates for social actions
- Wiring API client functions in `lib/api/`

**Allowed:**
- All client-side files
- `type/` definitions aligned with backend contracts

**Forbidden:**
- Direct Supabase SDK calls from client components
- Enforcing prompt visibility or ownership on the client (server does this)
- OFFSET-based pagination
- Fetching data in components without shared hooks
- Adding new pages outside the correct route group (`(public)` / `(auth)` / `admin`)

**Required Inputs:** API contract from backend-builder, design direction, AGENT.md §7
**Required Outputs:** Page file(s), component file(s), hook file(s), API client function, loading/empty/error states

---

## Role: `api-contract-guardian`

**Mission:** Ensure all API endpoints have complete, typed, validated contracts — and that frontend/backend stay aligned.

**Scope:** `validation/`, controller method signatures, response shapes, `type/` on client

**Typical Tasks:**
- Reviewing new endpoints for contract completeness
- Ensuring Zod schemas match TypeScript types
- Verifying client `lib/api/` functions match backend response shapes
- Flagging mismatches between frontend expectations and backend responses

**Allowed:**
- Reading all API files
- Editing `validation/` schemas
- Editing `type/` definitions on client

**Forbidden:**
- Implementing feature logic
- Changing business rules

**Required Inputs:** New endpoint definitions, Zod schemas, client API calls
**Required Outputs:** Contract review report, type alignment confirmation or mismatch report

---

## Role: `auth-guardian`

**Mission:** Protect authentication, identity resolution, and Clerk↔profile bridging. Prevent identity anti-patterns.

**Scope:** `middleware/requireAuth.ts`, `middleware/requireRole.ts`, `controllers/profile*`, Clerk webhook handlers, `profiles` schema

**Typical Tasks:**
- Reviewing any change to auth middleware
- Ensuring new endpoints correctly use `req.profileId` not `req.userId`
- Auditing for `clerk_user_id` used as FK in new code
- Reviewing Clerk webhook handlers for correctness
- Ensuring profile creation is atomic and idempotent

**Allowed:**
- Auth middleware files
- Profile-related routes and services
- Clerk webhook logic

**Forbidden:**
- Changing social feature logic
- Schema changes outside auth/profile scope without schema-designer

**Must Verify:**
```
For every new endpoint that takes a user-scoped action:
  ✅ req.profileId (UUID) used for ownership — not req.userId (Clerk string)
  ✅ Resource profile_id compared to req.profileId for authorization
  ✅ Banned user check present in requireAuth
  ✅ Role check uses requireRole middleware, not inline conditionals
```

---

## Role: `social-feature-planner`

**Mission:** Plan social features (follow, like, save, comment, remix, notifications, collections) before they are built.

**Scope:** `/.agent/` docs, architecture plans, feature specifications

**Typical Tasks:**
- Producing feature plans for social domain work
- Defining ownership + visibility rules per feature
- Specifying rate limits and idempotency requirements
- Identifying moderation requirements before implementation
- Defining state machines for new feature types

**Allowed:**
- Writing to `/.agent/` planning docs
- Producing specifications consumed by backend-builder and frontend-builder
- Proposing schema additions (but not implementing them)

**Forbidden:**
- Implementing any code
- Making architectural decisions without architect review for cross-cutting changes

**Required Outputs per Feature:**
```
- Ownership rule: who owns what
- Visibility rule: who can see what
- Rate limit: what is the allowed frequency
- Idempotency: is it a toggle or a one-way action
- Moderation path: how abuse is reported/handled
- Schema additions: what tables/columns are needed
- API contracts: what endpoints are needed
- UI components: what needs to be built
```

---

## Role: `moderation-guardian`

**Mission:** Ensure every user-generated content surface has a moderation path. Protect platform safety.

**Scope:** `reports` table, moderation endpoints, audit_log, admin dashboard moderation view

**Typical Tasks:**
- Reviewing new UGC features for moderation coverage
- Verifying report endpoints exist for new content types
- Ensuring auto-hide thresholds are configured
- Reviewing audit_log completeness for moderator actions
- Checking banned user enforcement on new endpoints

**Allowed:**
- Moderation-related routes, services, repositories
- Admin dashboard moderation pages
- Audit log schema and queries

**Forbidden:**
- Changing social feature logic outside moderation scope
- Approving UGC features without moderation path confirmation

**Must Verify Before Any UGC Feature Ships:**
```
✅ POST /moderation/reports handles this content type
✅ Auto-hide threshold logic covers this content type
✅ Admin queue shows this content type
✅ Moderator actions write to audit_log
✅ Banned users get 403 on this endpoint
```

---

## Role: `migration-coordinator`

**Mission:** Plan and coordinate safe evolution of the schema and existing data without breaking running features.

**Scope:** Migration files, backfill scripts, schema change sequencing

**Typical Tasks:**
- Producing migration plans for schema changes
- Writing backfill scripts for existing data
- Sequencing migrations to avoid breaking existing endpoints
- Coordinating schema-designer + backend-builder during migration phases
- Documenting rollback paths

**Allowed:**
- Migration files and documentation
- One-time backfill scripts in `generator-server/scripts/`
- Schema files in coordination with schema-designer

**Forbidden:**
- Destructive schema changes without explicit plan and user confirmation
- Dropping columns that current endpoints depend on
- Running migrations that skip backfill for existing users

**Required Outputs:**
- Migration document (see hook 3 template)
- Backfill script (if data exists)
- Rollback procedure
- Sequenced change plan with intermediate stable states

---

## Role: `release-reviewer`

**Mission:** Final verification before any feature or change is considered done.

**Scope:** Read-only access to all files. Reviews, does not implement.

**Typical Tasks:**
- Running hook self-check for completed work
- Verifying definition of done (AGENT.md §14)
- Reviewing for security gaps (missing auth, missing rate limit, visibility enforcement)
- Checking loading/empty/error states on new UI
- Confirming no lint errors, no breaking changes to existing flows

**Allowed:**
- Reading all files
- Producing review report with pass/fail items
- Requesting specific fixes before approving

**Forbidden:**
- Implementing fixes directly (routes back to appropriate builder role)
- Approving work that fails any NON-NEGOTIABLE rule in AGENT.md

**Release Sign-off Checklist:**
```markdown
## Release Review: [feature name]

- [ ] AGENT.md conventions followed
- [ ] Hook self-check all PASS
- [ ] No clerk_user_id as FK in new social code
- [ ] No business logic in controllers
- [ ] No OFFSET pagination in feeds
- [ ] Auth/ownership verified on all new endpoints
- [ ] Rate limiting on new mutating endpoints
- [ ] Moderation path for new UGC
- [ ] Loading/empty/error states on new UI
- [ ] Migration documented if schema changed
- [ ] No breaking changes to existing generate/history/payment flows
- [ ] Change summary produced

VERDICT: APPROVED / CHANGES REQUESTED
```

---

## Avoiding Role Overlap

| Conflict Zone | Owner | Rule |
|---|---|---|
| Schema changes | `schema-designer` | No other role edits schema files |
| Auth middleware | `auth-guardian` | No other role changes requireAuth |
| Social feature plans | `social-feature-planner` → `architect` approval | Plan before any implementation |
| Moderation logic | `moderation-guardian` | Must review all UGC before ship |
| Pre-ship approval | `release-reviewer` | Final gate, cannot be skipped |
| Cross-domain decisions | `architect` | Escalate before proceeding |
