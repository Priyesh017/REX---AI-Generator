# Skill: Repo Refactor Guard (`13-repo-refactor-guard`)

**Type:** Advisory + Planning
**Use When:** Any refactor that moves, renames, or restructures existing code
**Subagent:** `architect`

---

## Purpose
Prevent refactors from accidentally breaking existing features, changing behavior, or creating architectural regressions.

## Refactor Safety Rules [NON-NEGOTIABLE]
1. Never rename a file AND change its logic in the same step
2. Never move a function AND modify it at the destination
3. Never refactor auth middleware without auth-guardian review
4. Never refactor payment controller without testing existing flow
5. Existing generate, history, and buy flows must remain functional throughout any refactor

## Pre-Refactor Checklist
```
Before any refactor:
✅ Read every file being moved/changed
✅ List all callers/importers of the current code
✅ Confirm: does this change behavior or only structure?
✅ Identify which existing endpoints/features depend on this code
✅ Define intermediate stable states (each step = working repo)
✅ Get architect approval if cross-domain
```

## Safe Refactor Sequence
```
Step 1: Create new location (new file, new function, new folder)
Step 2: Copy (not move) logic to new location
Step 3: Update callers to use new location
Step 4: Verify existing tests/behavior unchanged
Step 5: Remove old location
Step 6: Verify again
```

## Current Code to Refactor Safely

| File | Target | Risk | Notes |
|---|---|---|---|
| `controllers/generateController.ts` | Split into `services/generation.service.ts` + `repositories/generation.repository.ts` + thin controller | Medium | Keep endpoint contract unchanged |
| `controllers/historyController.ts` | Integrate with `generated_images` domain | Medium | Preserve response shape |
| `controllers/getUserDetails.ts` | Merge into `services/profile.service.ts` | Low | New profile system |
| `controllers/adminController.ts` | Extend with moderation endpoints | Low | Additive |
| `routes/routes.ts` | Split into domain route files | Medium | Keep all paths identical |

## Import Path Tracking
```typescript
// Before refactoring: document all current imports
// Example: Find all files that import from generateController
grep -r "generateController" ./src --include="*.ts"

// After refactor: verify no broken imports
tsc --noEmit
```

## Protected Files (Do Not Refactor Without Explicit Plan)
- `middleware/` — any change requires auth-guardian
- `controllers/paymentController.ts` — any change requires billing review
- `server.ts` — only additive changes
- Any file touched in last 7 days (check git log first)

## References
- AGENT.md §12 (how agents propose changes)
- `.agent/workflows/WORKFLOW.md` → Refactor workflow
- `.agent/hooks/HOOKS.md` → `architecture-drift`
