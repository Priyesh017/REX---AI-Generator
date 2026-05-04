# Skill: Supabase Schema (`04-supabase-schema`)

**Type:** Planning + Implementation
**Use When:** Adding tables, columns, indexes, or triggers to the Supabase/Postgres schema
**Subagent:** `schema-designer`

---

## Purpose
Design and evolve the DB schema safely with migration documentation, constraints, and indexes.

## Inputs Expected
- Feature requiring schema change
- Current table list (inspect `domain/schema/`)
- Relationship requirements

## Outputs Required
- Drizzle schema file(s) in `domain/schema/`
- Migration document (see hook 3 template in HOOKS.md)
- Index list
- Trigger definitions (if denormalized counters)

## Core Tables Reference

| Table | Owner domain | Primary purpose |
|---|---|---|
| `profiles` | auth | Internal identity, social counters |
| `generated_images` | generation | Studio assets (drafts) |
| `posts` | posts | Published social content |
| `post_tags` / `tags` | posts | Tagging system |
| `follows` | social | Social graph |
| `post_likes` | social | Like actions |
| `post_saves` | social | Save/bookmark actions |
| `comments` | social | Comment threads |
| `notifications` | notifications | Activity feed |
| `reports` | moderation | Abuse reports |
| `audit_log` | moderation | Moderator action trail |
| `collections` | collections | Curated albums |
| `collection_items` | collections | Posts in albums |
| `subscriptions` | billing | Active plans |
| `credit_transactions` | billing | Credit ledger |

## Non-Negotiable Schema Rules

1. Every social table FK → `profiles.id` (UUID), never `clerk_user_id`
2. Every new FK column must have an index
3. Every status/visibility column must have CHECK constraint
4. `generated_images.post_id` must be UNIQUE (one-to-one published constraint)
5. `posts` and `generated_images` are never merged into one table
6. `audit_log` is append-only; no UPDATE or DELETE allowed on it

## Drizzle Schema Template
```typescript
// domain/schema/{feature}.schema.ts
import { pgTable, uuid, text, boolean, integer, timestamp, check } from 'drizzle-orm/pg-core'
import { profiles } from './profiles.schema'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('published'),
  // ...
}, (table) => ({
  profileIdIdx: index('idx_posts_profile_id').on(table.profileId),
  statusIdx: index('idx_posts_status').on(table.status),
  statusCheck: check('posts_status_check', sql`status IN ('published','hidden','removed')`),
}))
```

## Counter Trigger Pattern
```sql
-- Maintain likes_count on posts when post_likes changes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();
```

## References
- AGENT.md §8 (DB conventions)
- `.agent/hooks/HOOKS.md` → `db-migration`, `unsafe-data-access`
- Part 1 Blueprint: §4 (full schema with all tables)
