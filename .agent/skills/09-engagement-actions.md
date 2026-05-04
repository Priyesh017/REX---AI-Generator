# Skill: Engagement Actions (`09-engagement-actions`)

**Type:** Implementation
**Use When:** Building like, save, follow, comment, or remix features

---

## Purpose
Implement social engagement actions with idempotency, optimistic UI, counter maintenance, and notification triggering.

## Pre-Implementation Checklist (from social-domain-boundary hook)
```
For every engagement action:
✅ Ownership defined (who can act, on whose content)
✅ Idempotency: toggle re-execution is safe
✅ Counter: which denormalized counter updates
✅ Notification: who gets notified
✅ Rate limit: how often per user
✅ Moderation: is there a report path for this content type
```

## Action Reference Table

| Action | Idempotent | Counter | Notification | Rate Limit |
|---|---|---|---|---|
| Like post | YES (toggle) | `posts.likes_count` | post owner: 'like' | 60/min/user |
| Unlike post | YES | `posts.likes_count` | none | same |
| Save post | YES (toggle) | `posts.saves_count` | none | 60/min/user |
| Unsave post | YES | `posts.saves_count` | none | same |
| Follow user | YES (toggle) | `profiles.follower_count` + `following_count` | followee: 'follow' | 50/hr/user |
| Unfollow user | YES | both counters | none | same |
| Comment | NO (additive) | `posts.comments_count` | post owner: 'comment' | 10/min/user |
| Delete comment | soft delete | `posts.comments_count` | none | — |
| Remix (generate) | N/A | — | source post owner: 'remix' | gen rate limit |

## Toggle Implementation Pattern (like/save/follow)
```typescript
// services/social.service.ts
async function toggleLike(profileId: string, postId: string) {
  // Verify post exists and is published
  const post = await postRepository.findPublishedById(postId)
  if (!post) throw new NotFoundError('Post not found')

  // Idempotent toggle
  const existing = await socialRepository.findLike(profileId, postId)
  if (existing) {
    await socialRepository.deleteLike(profileId, postId)
    return { liked: false, likesCount: post.likesCount - 1 }
  } else {
    await socialRepository.createLike(profileId, postId)
    if (post.profileId !== profileId) {  // don't notify self-like
      await notificationService.queue('like', post.profileId, profileId, 'post', postId)
    }
    return { liked: true, likesCount: post.likesCount + 1 }
  }
}
```

## Repository Idempotency Pattern
```typescript
// repositories/social.repository.ts
async function createLike(profileId: string, postId: string) {
  await db.insert(postLikes)
    .values({ profileId, postId })
    .onConflictDoNothing()  // safe re-execution
}

async function deleteLike(profileId: string, postId: string) {
  await db.delete(postLikes)
    .where(and(eq(postLikes.profileId, profileId), eq(postLikes.postId, postId)))
}
```

## Follow Self-Check [NON-NEGOTIABLE]
```typescript
// In follow service
if (targetProfileId === callerProfileId) {
  throw new BadRequestError('Cannot follow yourself')
}
```

## Remix Pattern
```typescript
// Remix = new generation pre-seeded with source post data
// Sets generated_images.remix_source_post_id on the new image
// Does NOT copy or re-publish the source post
// User must explicitly publish their remixed generation as a new post
```

## Frontend Optimistic Pattern
```typescript
// hooks/useLikePost.ts
export function useLikePost(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (liked: boolean) => liked ? socialApi.likePost(postId) : socialApi.unlikePost(postId),
    onMutate: async (liked) => {
      await qc.cancelQueries({ queryKey: ['post', postId] })
      const prev = qc.getQueryData(['post', postId])
      qc.setQueryData(['post', postId], (old: Post) => ({
        ...old, isLiked: liked, likeCount: old.likeCount + (liked ? 1 : -1)
      }))
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['post', postId], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['post', postId] }),
  })
}
```

## References
- AGENT.md §9 (social platform rules)
- `.agent/hooks/HOOKS.md` → `social-domain-boundary`
