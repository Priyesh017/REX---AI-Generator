# Skill: Feed & Discovery (`08-feed-and-discovery`)

**Type:** Implementation
**Use When:** Building home feed, explore page, search, or tag pages

---

## Purpose
Build feed queries and UI correctly — keyset pagination, index-backed ordering, efficient joins.

## Non-Negotiable Feed Rules
1. **NO OFFSET pagination** — use keyset cursors only
2. Every feed endpoint must return `nextCursor` and `hasMore`
3. Feed ordering must be backed by a DB index
4. Like/save status for authenticated users must be resolved in one query (not N+1)
5. Profile data must be JOINed (not fetched per-post)

## Cursor Pagination Pattern
```typescript
// utils/cursor.ts
export function encodeCursor(publishedAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ publishedAt: publishedAt.toISOString(), id })).toString('base64url')
}

export function decodeCursor(cursor: string): { publishedAt: Date; id: string } {
  const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString())
  return { publishedAt: new Date(parsed.publishedAt), id: parsed.id }
}
```

## Home Feed Query Pattern
```typescript
// repositories/feed.repository.ts
async function getHomeFeed(profileId: string, cursor?: string, limit = 20) {
  const cursorCondition = cursor
    ? sql`(p.published_at, p.id) < (${decodeCursor(cursor).publishedAt}, ${decodeCursor(cursor).id})`
    : sql`true`

  return db.select({
    // post fields
    id: posts.id, title: posts.title, imageUrl: generatedImages.publicUrl,
    likeCount: posts.likesCount, commentCount: posts.commentsCount,
    publishedAt: posts.publishedAt,
    // creator fields
    creatorUsername: profiles.username, creatorAvatar: profiles.avatarUrl,
    // viewer status (LEFT JOIN — NULL = not liked)
    isLiked: sql<boolean>`${postLikes.profileId} IS NOT NULL`,
    isSaved: sql<boolean>`${postSaves.profileId} IS NOT NULL`,
  })
  .from(posts)
  .innerJoin(follows, and(eq(follows.followeeId, posts.profileId), eq(follows.followerId, profileId)))
  .innerJoin(profiles, eq(profiles.id, posts.profileId))
  .innerJoin(generatedImages, eq(generatedImages.id, posts.generatedImageId))
  .leftJoin(postLikes, and(eq(postLikes.postId, posts.id), eq(postLikes.profileId, profileId)))
  .leftJoin(postSaves, and(eq(postSaves.postId, posts.id), eq(postSaves.profileId, profileId)))
  .where(and(eq(posts.status, 'published'), cursorCondition))
  .orderBy(desc(posts.publishedAt), desc(posts.id))
  .limit(limit + 1)  // +1 to detect hasMore
}
```

## Frontend Feed Pattern
```typescript
// hooks/useFeed.ts
export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: ({ pageParam }) => feedApi.getHome({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    staleTime: 30_000,
  })
}
```

## Feed Endpoint Response Shape
```typescript
{
  data: PostCard[],
  meta: {
    nextCursor: string | null,
    hasMore: boolean
  }
}
```

## Explore Feed Scoring (Phase 2)
```sql
-- Engagement score within time window (last 48h)
score = (likes_count * 1.0) + (saves_count * 1.5) + (comments_count * 2.0)
WHERE published_at > NOW() - INTERVAL '48 hours'
ORDER BY score DESC
-- Index: posts(published_at) — already exists for feed
```

## Search Implementation
```sql
-- Full text search on title + caption
WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(caption,'')) @@ plainto_tsquery($query)
-- Covered by GIN index: idx_posts_full_text
```

## Required Feed Indexes
```sql
-- Must exist before any feed feature ships
CREATE INDEX idx_posts_published_at ON posts(published_at DESC, id DESC);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_post_likes_viewer ON post_likes(post_id, profile_id);
```

## References
- AGENT.md §8 (DB conventions — keyset pagination)
- `.agent/hooks/HOOKS.md` → `api-contract`, `unsafe-data-access`
