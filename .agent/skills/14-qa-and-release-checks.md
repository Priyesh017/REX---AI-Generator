# Skill: QA & Release Checks (`14-qa-and-release-checks`)

**Type:** Verification
**Use When:** Verifying any feature before it is considered done, or before any PR/deploy
**Subagent:** `release-reviewer`

---

## Purpose
Provide a concrete verification checklist to confirm work is production-ready by REX standards.

## Release Readiness Checklist

### Architecture
- [ ] Layer separation respected: routes → controllers → services → repositories
- [ ] No business logic in controllers
- [ ] No DB queries outside repositories
- [ ] No direct Supabase calls from client components
- [ ] clerk_user_id not used as FK in any social table
- [ ] generated_images and posts not confused

### API & Validation
- [ ] All new endpoints have Zod validation
- [ ] Standard response shape used: `{ data }` or `{ error, code }`
- [ ] Auth level explicit on all new endpoints
- [ ] Rate limiting applied to all mutating endpoints
- [ ] Ownership check in service for all user-scoped mutations

### Database
- [ ] Migration document written if schema changed
- [ ] All new FK columns indexed
- [ ] All new status columns have CHECK constraint
- [ ] Counter triggers defined for new denormalized counters
- [ ] No OFFSET pagination anywhere

### Social Features
- [ ] Prompt visibility enforced server-side (not client)
- [ ] Ownership verified before allowing mutations
- [ ] Visibility rules implemented (public/followers/private)
- [ ] Rate limiting applied to social actions
- [ ] Report mechanism exists for new UGC
- [ ] Audit log written for moderator actions

### Frontend
- [ ] All data-fetching components have loading state
- [ ] All data-fetching components have empty state
- [ ] All data-fetching components have error state + retry
- [ ] New pages in correct route group (public/auth/admin)
- [ ] Optimistic updates have onMutate + onError rollback
- [ ] No inline fetch logic (uses shared hooks)
- [ ] Accessibility: aria-labels on interactive elements, alt text on images

### Backward Compatibility
- [ ] Existing generate flow still works
- [ ] Existing history view still works
- [ ] Existing payment/buy flow still works
- [ ] Existing admin dashboard still works
- [ ] No breaking changes to existing API endpoint shapes

### Security
- [ ] No secrets in code or client
- [ ] No user data leaked across ownership boundaries
- [ ] Banned users get 403 on all new authenticated endpoints
- [ ] Webhook signatures verified (Razorpay, Clerk)

## Hook Self-Check (copy from HOOKS.md)
```markdown
| Hook | Result |
|---|---|
| architecture-drift | PASS / FAIL / NA |
| api-contract | PASS / FAIL / NA |
| db-migration | PASS / FAIL / NA |
| frontend-route-placement | PASS / FAIL / NA |
| social-domain-boundary | PASS / FAIL / NA |
| unsafe-data-access | PASS / FAIL / NA |
| agent-plan-completeness | PASS / FAIL / NA |
| moderation-coverage | PASS / FAIL / NA |
```

## Test Expectations

### Unit Tests (Vitest)
- New service functions have unit tests
- Prompt visibility resolution is unit tested for all 4 visibility × viewer combos
- Credit deduction logic is unit tested (including rollback on failure)

### Integration Tests
- New repository functions tested against test DB
- Feed pagination returns correct cursor behavior

### E2E (if applicable)
- Happy path: generate → publish → appears in feed
- Auth guard: unauthenticated access to protected routes returns 401

## Change Summary (produce at end of every task)
```markdown
## Change Summary: [feature name]
**Type:** feature | bugfix | refactor | migration
**Scope:** [files changed]
**Domain(s):** [list]
**Architecture compliance:** ✅ all AGENT.md rules followed
**Hooks:** [results]
**Backward compat:** ✅ verified / ⚠️ [note any changes]
**Risks:** [or "none"]
**Follow-on:** [what remains]
```

## References
- AGENT.md §14 (definition of done)
- `.agent/subagents/ROLES.md` → `release-reviewer`
- `.agent/hooks/HOOKS.md` → full hook reference
