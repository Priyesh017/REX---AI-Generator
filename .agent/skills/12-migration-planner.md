# Skill: Migration Planner (`12-migration-planner`)

**Type:** Planning
**Use When:** Evolving schema or data for existing users, or introducing new architecture alongside existing code
**Subagent:** `migration-coordinator`

---

## Purpose
Plan safe incremental schema and data migrations that maintain running features and backward compatibility.

## Migration Principles
1. Every migration must have a stable intermediate state (no broken states)
2. Additive first: new tables/columns before removing old ones
3. Code changes ship with schema changes — never ahead or behind by more than one step
4. Backfill existing data before switching code to the new schema
5. Grace period for removed columns: mark deprecated, remove in next sprint

## Current Migration Priorities (from existing → social platform)

| Priority | Migration | Risk |
|---|---|---|
| P0 | Create `profiles` table; backfill from existing Clerk users | High — existing users |
| P0 | Create `generated_images` table; backfill from existing image history | High — production data |
| P1 | Create `posts`, `follows`, `post_likes`, `post_saves`, `comments` | Medium |
| P1 | Create `notifications`, `reports`, `audit_log` | Low |
| P2 | Create `collections`, `collection_items` | Low |
| P2 | Create `credit_transactions`; backfill from existing credits | Medium |

## Migration Document Template
```markdown
## Migration: [name]
**Date:** YYYY-MM-DD  **Risk:** High|Medium|Low
**Author:** [agent/human]  **Reviewed by:** [architect/auth-guardian/etc]

### What Changed
[table: column/index/trigger added/removed]

### Why
[product or architecture reason]

### Existing Data Handling
[backfill script name + logic summary, or "N/A - new table"]

### Backward Compatibility
[what existing endpoints/code remain unchanged]

### Rollback
[exact SQL or steps to undo]

### Deployment Sequence
1. [deploy schema change]
2. [run backfill script]
3. [deploy code change]
4. [verify with health check]

### Verification
[SQL query to verify migration success]
```

## P0 Migration: Profiles Backfill
```typescript
// scripts/migrate-profiles.ts
// Run ONCE after profiles table created
async function backfillProfiles() {
  // Fetch all Clerk users (use Clerk SDK or your existing user table)
  const users = await fetchAllExistingUsers()

  for (const user of users) {
    const username = await generateUniqueUsername(user.email)
    await db.insert(profiles).values({
      clerkUserId: user.clerkId,
      username,
      displayName: user.name,
      avatarUrl: user.imageUrl,
      creditsRemaining: user.credits,  // copy existing credits
    }).onConflictDoNothing()
  }
}
```

## P0 Migration: Generated Images Backfill
```typescript
// scripts/migrate-generated-images.ts
async function backfillGeneratedImages() {
  const existingImages = await fetchAllExistingImageHistory()

  for (const img of existingImages) {
    const profile = await profileRepository.findByClerkId(img.userClerkId)
    if (!profile) continue

    await db.insert(generatedImages).values({
      id: img.id,  // preserve existing IDs if possible
      profileId: profile.id,
      prompt: img.prompt,
      model: img.model,
      storagePath: img.storagePath,
      publicUrl: img.url,
      status: 'completed',
      postId: null,  // all existing are drafts until user chooses to publish
      createdAt: img.createdAt,
    }).onConflictDoNothing()
  }
}
```

## Feature Flag Strategy During Migration
```typescript
// Use env flags to gate new social features during transition
const SOCIAL_ENABLED = process.env.NEXT_PUBLIC_SOCIAL_ENABLED === 'true'

// Flip to 'true' after migration verified in staging
```

## References
- AGENT.md §13 (migration strategy from blueprint Part 3)
- `.agent/hooks/HOOKS.md` → `db-migration`
- `.agent/subagents/ROLES.md` → `migration-coordinator`
