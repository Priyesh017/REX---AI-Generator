# AGENT.md — REX Repository Operating Manual

> **This file is the primary control surface for all AI agents working in this repository.**
> Read this before reading any other file. Follow every rule marked [NON-NEGOTIABLE].
> Skills, hooks, subagents, and workflows in `/.agent/` extend this file — they never override it.

---

## 1. Mission

REX is evolving from a standalone AI image generator into an **Instagram-like social platform for AI-generated art**.

The product mission is:
- Users generate images from prompts inside the app
- Generated images begin as **private drafts** (studio assets)
- Users explicitly publish drafts as **social posts** with visibility, captions, and tags
- Other users browse a feed, explore trending posts, follow creators, like/save/comment/remix
- Prompt authorship and creative lineage are first-class product concepts

AI agents working here must protect this evolution. Every change should move toward this goal or be safely neutral to it.

---

## 2. Repository Structure (Current)

```
REX---AI-Generator/
├── AGENT.md                        ← YOU ARE HERE
├── .agent/                         ← AI operating framework
│   ├── skills/                     ← Domain-specific skill files
│   ├── hooks/                      ← Quality gates and policy checks
│   ├── subagents/                  ← Specialized agent role definitions
│   └── workflows/                  ← Task and coordination workflows
├── generator-client/               ← Next.js 15 frontend
│   ├── app/                        ← App Router routes
│   │   ├── admin/                  ← Admin dashboard (existing)
│   │   ├── buy/                    ← Payment/subscription (existing)
│   │   ├── generate/               ← Image generation studio (existing)
│   │   └── profile/                ← User profile (existing, basic)
│   ├── components/
│   │   ├── ui/                     ← shadcn/ui primitives
│   │   ├── landingpage/            ← Landing page sections
│   │   └── pages/                  ← Page-level components
│   ├── lib/                        ← Utilities
│   ├── type/                       ← TypeScript types
│   └── data/                       ← Static data/constants
└── generator-server/               ← Express + TypeScript backend
    └── src/
        ├── config/                 ← DB/env config
        ├── controllers/            ← HTTP handlers (thin)
        ├── middleware/             ← Auth, rate limiting
        ├── routes/                 ← Route definitions
        ├── lib/                    ← Shared utilities
        └── utils/                  ← Helper functions
```

## 3. Target Architecture (Future State)

```
generator-client/app/
├── (public)/
│   ├── page.tsx                    → / home feed
│   ├── explore/page.tsx            → /explore
│   ├── posts/[id]/page.tsx         → /posts/:id
│   ├── profile/[username]/page.tsx → /profile/:username
│   └── tags/[slug]/page.tsx        → /tags/:slug
├── (auth)/
│   ├── generate/page.tsx           → /generate (studio)
│   ├── studio/history/page.tsx     → /studio/history (drafts)
│   ├── notifications/page.tsx      → /notifications
│   └── settings/page.tsx           → /settings
└── admin/page.tsx                  → /admin

generator-client/components/
├── post/        feed-related UI
├── feed/        infinite scroll, feed layouts
├── profile/     profile header, follow button, grids
├── studio/      generation UI, publish dialog
├── comment/     comment panel, thread
├── notification/ bell, notification items
└── common/      Avatar, Skeleton, EmptyState, ErrorBoundary

generator-server/src/
├── domain/
│   ├── types/   TypeScript interfaces per domain
│   └── schema/  Drizzle ORM table definitions
├── repositories/  DB access layer (one file per domain)
├── services/      Business logic (one file per domain)
├── controllers/   HTTP handlers (thin, delegate to services)
├── routes/        Route mounting
├── middleware/    requireAuth, requireRole, rateLimiter, validateBody
├── validation/    Zod schemas per domain
├── jobs/          BullMQ workers (thumbnail, fan-out, cron)
└── utils/         cursor, promptVisibility, storage, logger
```

---

## 4. Current Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind | App Router, RSC |
| Auth | Clerk | JWT-based; webhook for user sync |
| Backend | Express + TypeScript | REST API |
| Database | Supabase (Postgres) | Drizzle ORM preferred |
| Storage | Supabase Storage | Images, thumbnails |
| AI Generation | Hugging Face | Via generateController.ts |
| Payments | Razorpay | Orders, webhooks, credits |
| State (client) | TanStack Query + Zustand | Server/global state split |

---

## 5. Domain Model — Core Rules [NON-NEGOTIABLE]

### 5.1 The Two-Entity Rule
```
generated_images  ≠  posts

generated_images = private studio asset, created on generation
posts            = public social object, created by explicit user action

An image becomes a post only when the user publishes it.
A post always references one generated_image (1:1).
One generated_image can only back one post (UNIQUE FK).
```

### 5.2 Identity Anchor Rule
```
profiles.id (internal UUID) = relational anchor for ALL social tables
clerk_user_id               = external identity mapping ONLY
                              stored only in profiles.clerk_user_id

NEVER use clerk_user_id as FK in:
  follows, post_likes, post_saves, comments, notifications,
  reports, collections, credit_transactions, or posts
```

### 5.3 Generation History Rule
```
The current /generate history is a DRAFT WORKFLOW surface, not a long-term product.
Agents must evolve history toward /studio/history (draft management).
Never build new permanent architecture on top of raw generation history.
```

### 5.4 Visibility Rule
```
Every entity that users can view must have an explicit visibility state.
Prompt visibility: public | partial | followers | private
Post status: published | hidden | removed
Collection: public | followers | private

Visibility is ALWAYS enforced server-side.
Client receives only what it is allowed to see — never filter on frontend alone.
```

---

## 6. Backend Coding Conventions

### Layer Responsibilities [NON-NEGOTIABLE]

| Layer | Responsibility | Must NOT do |
|---|---|---|
| `routes/` | Mount router, attach middleware | Contain logic |
| `controllers/` | Parse req → call service → send res | Contain business logic or DB calls |
| `services/` | Business workflows, orchestration | Direct DB queries |
| `repositories/` | DB queries via Drizzle ORM | Business decisions |
| `validation/` | Zod schemas, boundary checks | Side effects |
| `middleware/` | Auth, roles, rate-limit, validation wrapper | Feature logic |

### Auth Pattern [NON-NEGOTIABLE]
```typescript
// Every authenticated route must:
// 1. Verify Clerk JWT (requireAuth middleware)
// 2. Resolve internal profileId from clerk_user_id
// 3. Attach req.profileId (UUID) and req.role to request

// NEVER trust user-supplied profileId from request body/params for ownership checks
// ALWAYS derive ownership from req.profileId vs resource.profile_id
```

### Response Shape Standard
```typescript
// Success
{ data: T, meta?: { cursor?: string, total?: number } }

// Error
{ error: string, code: string, details?: unknown }
```

### Rate Limiting — Required for
- POST /generate (10/hour/user)
- POST /posts/:id/comments (10/min/user)
- POST /social/follow (50/hour/user)
- POST /moderation/reports (20/hour/user)

---

## 7. Frontend Coding Conventions

### Route Placement
- Public pages (feed, explore, posts, profiles) → `app/(public)/`
- Auth-required pages (generate, studio, notifications, settings) → `app/(auth)/`
- Admin pages → `app/admin/`

### Component Placement
- Feature components → `components/{domain}/` (post/, feed/, profile/, studio/, comment/)
- Design system primitives → `components/ui/`
- Shared layout utilities → `components/common/`

### Data Fetching
- Server Components for initial SEO-relevant data (feed first page, post detail, profile)
- TanStack Query for client-side pagination, mutations, optimistic updates
- Never duplicate fetch logic — use shared hooks in `hooks/`
- Every data-fetching component must implement: loading skeleton, empty state, error boundary

### Optimistic Updates — Allowed for
- Like toggle, Save toggle, Follow toggle (reversible mutations)
- Must implement: onMutate (optimistic) → onError (rollback) → onSettled (invalidate)

### Forbidden on Frontend
- Prompt visibility decisions (server enforces, client only displays)
- Ownership checks on raw data (backend sends pre-filtered responses)
- Direct Supabase SDK calls from client (go through backend API)

---

## 8. Database Conventions

### Schema Changes
- Every schema change requires a named migration file
- Every migration must include: what changed, why, rollback path
- No silent schema drift — document all intentional deviations from previous state

### Indexing Requirements
- All FK columns must be indexed
- All `status` columns used in WHERE clauses must be indexed
- Feed queries must use keyset pagination index (published_at DESC, id DESC)
- Notification queries must be indexed by (profile_id, is_read, created_at DESC)

### Counter Denormalization
- Denormalized counters (likes_count, follower_count, etc.) must be maintained via DB triggers
- Nightly reconciliation job must verify counters against actual counts
- Never rely on application-layer counter updates alone

---

## 9. Social Platform Specific Rules

### No Social Feature Without
1. Ownership check (who owns the resource)
2. Visibility rule (who can see what)
3. Rate limit consideration (how fast can users act)
4. Moderation path (how abuse is handled)

### No Feed Feature Without
1. Cursor-based pagination (no OFFSET)
2. Index justification for ordering
3. Empty state handling

### No Publishing Flow Without
1. Prompt visibility selector
2. Ownership verification (you can only publish your own generated_image)
3. Status transition record (draft → published)

### Moderation [NON-NEGOTIABLE]
- Report endpoint must exist before any user-generated content feature goes live
- Auto-hide threshold logic must be implemented for posts and comments
- Moderator action must write to audit_log — no exceptions

---

## 10. Clerk Identity Rules [NON-NEGOTIABLE]

1. `profiles.clerk_user_id` stores the Clerk user ID (TEXT)
2. All social relations use `profiles.id` (UUID)
3. `requireAuth` middleware resolves Clerk → profileId on every authenticated request
4. Profile creation happens via Clerk webhook `user.created`
5. Profile updates sync from Clerk webhook `user.updated`
6. Never store Clerk JWT in database
7. Never pass Clerk user ID through the social API as a relational key

---

## 11. Supabase Storage Rules

```
Bucket layout:
  generated-images/{profile_id}/{image_id}/original.webp
  generated-images/{profile_id}/{image_id}/thumb.webp
  generated-images/{profile_id}/{image_id}/preview.webp

Access policy:
  Drafts    → private bucket, short-lived signed URLs (15 min), owner only
  Published → public bucket path OR long-lived signed URL after publish
  Avatars   → public bucket
  Banners   → public bucket

On publish: copy from private → public path (or upgrade to long-lived URL)
Never return raw Supabase storage paths to clients — always resolve to URLs
```

---

## 12. How AI Agents Should Work in This Repo

### Before Editing Any File
1. Read `AGENT.md` (this file) fully
2. Read the relevant skill file in `/.agent/skills/`
3. Inspect the files you plan to touch — do not guess current state
4. Check if a plan is required (see §13)

### When Planning is Mandatory
- Any change touching 3+ files across domains
- Any schema change (new table, new column, dropped column)
- Any new API endpoint
- Any new page/route
- Any change to auth middleware or profile resolution
- Any change to visibility/permission logic
- Any migration of existing data

### How to Propose Changes
```
## Proposed Change: [title]

**Scope:** [files/folders affected]
**Rationale:** [why this change]
**Assumptions:** [what I am assuming about current state]
**Risks:** [what could go wrong]
**Alternatives considered:** [other approaches]
**Architecture compliance:** [how this follows AGENT.md rules]
**Migration required:** yes/no — [if yes, describe]
**Test expectations:** [what should be tested]
```

### When to Stop and Ask
- Requirement is ambiguous about product behavior (not implementation)
- Change would break existing auth flow or payment flow
- Schema migration would affect existing data
- Business logic for visibility/moderation is unclear
- Change touches both frontend and backend without clear contract first

---

## 13. What Agents Must Never Do [NON-NEGOTIABLE]

- Use `clerk_user_id` as FK in any social table
- Put business logic in controllers
- Put DB queries in controllers or routes
- Skip validation on incoming API payloads
- Add new UI without a corresponding backend contract
- Use OFFSET-based pagination for feeds
- Store sensitive data (JWT, secrets) in DB
- Blur the generated_image ↔ post boundary
- Make social features without ownership + visibility rules
- Make schema changes without a migration plan
- Deploy frontend prompt-visibility enforcement as a security control
- Copy-paste one-off fetch logic across page components
- Add complexity not immediately required by current product phase

---

## 14. Definition of Done

A task is complete when:
- [ ] All code follows conventions in §6–§11
- [ ] All affected files inspected before editing (no guessing)
- [ ] Architecture compliance verified against §5
- [ ] Relevant hook checklist passed (see `/.agent/hooks/`)
- [ ] Loading, empty, and error states implemented for any UI component
- [ ] Rate limiting considered for any new mutating endpoint
- [ ] Moderation path considered for any UGC feature
- [ ] No new lint errors introduced
- [ ] Migration plan documented if schema changed
- [ ] Change summary produced in standard format (see §12)

---

## 15. Skill Index

| Skill | File | Use When |
|---|---|---|
| Repo architecture | `.agent/skills/01-repo-architecture.md` | Architecture decisions, refactors |
| Frontend social UI | `.agent/skills/02-frontend-social-ui.md` | Building feed/post/profile UI |
| Backend social API | `.agent/skills/03-backend-social-api.md` | New API endpoints |
| Supabase schema | `.agent/skills/04-supabase-schema.md` | DB changes |
| Auth & profile flow | `.agent/skills/05-auth-and-profile-flow.md` | Clerk/profile work |
| Generation pipeline | `.agent/skills/06-generation-pipeline.md` | Studio/generate changes |
| Post publishing | `.agent/skills/07-post-publishing-workflow.md` | Publish flow changes |
| Feed & discovery | `.agent/skills/08-feed-and-discovery.md` | Feed/explore/search |
| Engagement actions | `.agent/skills/09-engagement-actions.md` | Like/save/follow/comment |
| Moderation & safety | `.agent/skills/10-moderation-and-safety.md` | Reports/moderation |
| Billing & credits | `.agent/skills/11-billing-and-credits.md` | Razorpay/credit work |
| Migration planner | `.agent/skills/12-migration-planner.md` | Schema/data migrations |
| Refactor guard | `.agent/skills/13-repo-refactor-guard.md` | Large refactors |
| QA & release | `.agent/skills/14-qa-and-release-checks.md` | Pre-release verification |

---

## 16. Subagent Roles

See `/.agent/subagents/ROLES.md` for full definitions.

| Role | Primary Domain |
|---|---|
| `architect` | Cross-cutting decisions, guardrails |
| `schema-designer` | Supabase schema, migrations |
| `backend-builder` | Services, controllers, repositories |
| `frontend-builder` | Next.js pages, components, hooks |
| `api-contract-guardian` | API shape, validation, contracts |
| `auth-guardian` | Clerk, identity, profile resolution |
| `social-feature-planner` | Social product features planning |
| `moderation-guardian` | Safety, reports, audit |
| `migration-coordinator` | Safe schema/data evolution |
| `release-reviewer` | Pre-ship verification |

---

## 17. Hooks Index

See `/.agent/hooks/HOOKS.md` for full definitions.

| Hook | Trigger | Blocking? |
|---|---|---|
| `architecture-drift` | Before any multi-file edit | Yes |
| `api-contract` | Before any new endpoint | Yes |
| `db-migration` | Before any schema change | Yes |
| `frontend-route-placement` | Before any new page | Yes |
| `social-domain-boundary` | Before any social feature | Yes |
| `unsafe-data-access` | Before any DB-touching code | Yes |
| `agent-plan-completeness` | Before any 3+ file change | Yes |
| `moderation-coverage` | Before any UGC feature | Yes |

---

*Last updated: 2026-05-04 | Maintained by: engineering team + AI agents*
*This file is the source of truth. All other `.agent/` files extend it.*
