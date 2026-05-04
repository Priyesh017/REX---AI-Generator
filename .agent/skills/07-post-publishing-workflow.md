# Skill: Post Publishing Workflow (`07-post-publishing-workflow`)

**Type:** Implementation
**Use When:** Building or modifying the publish flow (draft → post)

---

## Purpose
Correctly implement the transition from private generated_image → public post, with prompt visibility, ownership, and fan-out.

## The Publish Contract [NON-NEGOTIABLE]
```
Input:  generatedImageId (must be owned by caller, status=completed, post_id=NULL)
Action: CREATE posts row + UPDATE generated_images.post_id atomically
Output: posts.id, post URL

Constraints:
  - Cannot publish another user's image (403)
  - Cannot publish same image twice (UNIQUE constraint on generated_images.post_id)
  - prompt_visibility must be one of: public | partial | followers | private
  - If visibility=partial, partialPrompt must be provided
```

## Service Implementation Pattern
```typescript
// services/post.service.ts
async function publishPost(profileId: string, data: PublishPostInput) {
  // 1. Verify ownership
  const image = await generationRepository.findById(data.generatedImageId)
  if (!image) throw new NotFoundError('Image not found')
  if (image.profileId !== profileId) throw new ForbiddenError('Not your image')
  if (image.postId) throw new ConflictError('Image already published')
  if (image.status !== 'completed') throw new BadRequestError('Image not ready')

  // 2. Atomic: create post + link image
  const post = await db.transaction(async (tx) => {
    const [newPost] = await tx.insert(posts).values({
      profileId,
      generatedImageId: image.id,
      title: data.title,
      caption: data.caption,
      promptVisibility: data.promptVisibility,
      partialPrompt: data.partialPrompt,
      status: 'published',
    }).returning()

    await tx.update(generatedImages)
      .set({ postId: newPost.id })
      .where(eq(generatedImages.id, image.id))

    return newPost
  })

  // 3. Handle tags (outside transaction, non-critical)
  if (data.tags?.length) await tagService.attachTags(post.id, data.tags)

  // 4. Move image to public storage path
  await storageService.promoteToPublic(image.storagePath, profileId, image.id)

  // 5. Fan-out notifications (async job, non-blocking)
  await notificationQueue.add('fan-out-publish', { postId: post.id, profileId })

  // 6. Increment post_count on profile
  await profileRepository.incrementPostCount(profileId)

  return post
}
```

## Prompt Visibility Enforcement
```typescript
// utils/promptVisibility.ts
// Called in post query layer — never on frontend
export function resolvePrompt(
  post: Post,
  viewerProfileId: string | null,
  isFollowing: boolean
): string | null {
  if (post.profileId === viewerProfileId) return post.prompt      // owner: always full
  switch (post.promptVisibility) {
    case 'public':    return post.prompt
    case 'partial':   return post.partialPrompt
    case 'followers': return isFollowing ? post.prompt : post.partialPrompt
    case 'private':   return null
  }
}
```

## Publish Dialog UI Checklist
```
PublishDialog component must include:
✅ Title input (max 100 chars)
✅ Caption textarea (max 2200 chars)
✅ Tag input (max 10 tags)
✅ Prompt visibility selector: public | partial | followers | private
✅ If partial selected: partial prompt input field shown
✅ Preview of the image being published
✅ Submit button disabled while loading
✅ Error state for server errors
✅ Success redirect to /posts/:id
```

## References
- AGENT.md §5.1 (two-entity rule), §9 (social platform rules)
- `.agent/skills/06-generation-pipeline.md`
- `.agent/skills/08-feed-and-discovery.md`
