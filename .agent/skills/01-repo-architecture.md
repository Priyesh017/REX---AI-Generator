# Skill: Repo Architecture (`01-repo-architecture`)

**Type:** Planning + Advisory
**Use When:** Making cross-domain decisions, adding new domains, restructuring folders, reviewing architecture compliance

---

## Purpose
Understand the full repo structure and enforce correct placement of new code. Use before any multi-domain task.

## Inputs Expected
- Description of proposed change
- Which domains are affected
- Current file structure context

## Outputs Required
- Confirmed domain ownership of new code
- File placement plan with exact paths
- Architecture compliance statement

## Current → Target Domain Map

| Domain | Server folder | Client folder | Status |
|---|---|---|---|
| Auth/Profile | `services/profile.service.ts` | `components/profile/` | 🔨 Build |
| Generation | `controllers/generateController.ts` | `app/(auth)/generate/` | ✅ Exists (refactor needed) |
| Posts | `services/post.service.ts` | `components/post/` | 🔨 Build |
| Feed | `services/feed.service.ts` | `components/feed/` | 🔨 Build |
| Social (follow/like/save) | `services/social.service.ts` | `hooks/useLikePost.ts` etc. | 🔨 Build |
| Comments | `services/comment.service.ts` | `components/comment/` | 🔨 Build |
| Notifications | `services/notification.service.ts` | `components/notification/` | 🔨 Build |
| Moderation | `services/moderation.service.ts` | `app/admin/moderation/` | 🔨 Build |
| Collections | `services/collection.service.ts` | `components/collection/` | 🔨 Phase 2 |
| Billing | `controllers/paymentController.ts` | `app/(auth)/buy/` | ✅ Exists |

## Placement Rules

### Server: New feature goes in this order
```
1. domain/schema/{feature}.schema.ts     ← Drizzle table definition
2. domain/types/{feature}.types.ts       ← TypeScript interfaces
3. repositories/{feature}.repository.ts  ← DB queries
4. validation/{feature}.validation.ts    ← Zod schemas
5. services/{feature}.service.ts         ← Business logic
6. controllers/{feature}.controller.ts   ← HTTP thin layer
7. routes/{feature}.routes.ts            ← Router + middleware
8. routes/index.ts                       ← Mount new router
```

### Client: New feature goes in this order
```
1. type/{feature}.types.ts               ← TS interfaces (match backend)
2. lib/api/{feature}.api.ts              ← API client functions
3. hooks/use{Feature}.ts                 ← TanStack Query hooks
4. components/{feature}/                 ← Feature components
5. app/(public|auth)/{route}/page.tsx    ← Route page
```

## Constraints
- Do not create new top-level folders without architect approval
- Domain names must be consistent between server and client
- Types must be defined before components that use them

## References
- AGENT.md §2 (repo structure), §3 (target architecture), §5 (domain model)
