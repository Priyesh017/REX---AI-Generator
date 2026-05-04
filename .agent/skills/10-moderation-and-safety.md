# Skill: Moderation & Safety (`10-moderation-and-safety`)

**Type:** Implementation + Advisory
**Use When:** Building report flows, moderation queues, auto-hide logic, or audit logging
**Subagent:** `moderation-guardian`

---

## Purpose
Ensure every user-generated content surface has a complete moderation path before it ships.

## Moderation Coverage Requirements [NON-NEGOTIABLE]

For every new UGC type, ALL of the following must exist before shipping:
```
✅ Report endpoint: POST /moderation/reports (with target_type for this content)
✅ Auto-hide threshold defined in DB trigger or service
✅ Admin queue view shows this content type
✅ Moderator action endpoints: approve_remove | dismiss | warn | ban
✅ All moderator actions write to audit_log
✅ Banned users return 403 from requireAuth middleware
```

## Report Entity State Machine
```
PENDING → UNDER_REVIEW → RESOLVED_REMOVED    (post/comment removed)
                       → RESOLVED_DISMISSED   (false report)
                       → RESOLVED_WARNED      (user warned, content kept)
```

## Auto-Hide Trigger Pattern
```sql
-- Trigger on reports INSERT: auto-hide if threshold crossed
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE report_count INT;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE target_type = NEW.target_type AND target_id = NEW.target_id AND status = 'pending';

  IF NEW.target_type = 'post' AND report_count >= 3 THEN
    UPDATE posts SET status = 'hidden' WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' AND report_count >= 2 THEN
    UPDATE comments SET is_hidden = true WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Audit Log Pattern [NON-NEGOTIABLE]
```typescript
// Every moderator action must write to audit_log
await db.insert(auditLog).values({
  actorId: req.profileId,
  action: 'remove_post',   // | 'dismiss_report' | 'warn_user' | 'ban_user'
  targetType: 'post',
  targetId: postId,
  metadata: { reason: data.moderatorNote, reportId: data.reportId },
})
// audit_log is NEVER updated or deleted
```

## Banned User Enforcement
```typescript
// In requireAuth middleware (already handles this):
if (profile.isBanned) return res.status(403).json({ error: 'Account suspended', code: 'BANNED' })

// Ban action in moderation service:
async function banUser(moderatorProfileId: string, targetProfileId: string) {
  await profileRepository.setBanned(targetProfileId, true)
  await auditRepository.log(moderatorProfileId, 'ban_user', 'profile', targetProfileId)
  // cache invalidation: clear profile from requireAuth cache
}
```

## Duplicate Report Prevention
```sql
-- Schema: one report per user per target
UNIQUE (reporter_id, target_type, target_id)
-- Constraint enforces at DB level; service should handle ConflictError gracefully
```

## Moderation Admin Queue Query
```typescript
// repositories/moderation.repository.ts
async function getPendingReports(limit = 50, cursor?: string) {
  return db.select({ ...reportFields, ...reporterFields, ...targetPreview })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.reporterId))
    .where(and(
      eq(reports.status, 'pending'),
      cursor ? sql`reports.created_at < ${decodeCursor(cursor).createdAt}` : sql`true`
    ))
    .orderBy(desc(reports.createdAt))
    .limit(limit)
}
```

## References
- AGENT.md §9 (social platform rules — moderation)
- `.agent/hooks/HOOKS.md` → `moderation-coverage`
- `.agent/subagents/ROLES.md` → `moderation-guardian`
