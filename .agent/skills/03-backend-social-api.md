# Skill: Backend Social API (`03-backend-social-api`)

**Type:** Implementation
**Use When:** Creating new REST endpoints for any social domain

---

## Purpose
Build Express endpoints that are thin, validated, authorized, and correctly layered.

## Inputs Expected
- Domain name (posts / social / feed / comments / notifications / moderation)
- Endpoint spec: method, path, auth level, payload, response

## Outputs Required
- Zod validation schema in `validation/`
- Repository function in `repositories/`
- Service function in `services/`
- Controller function in `controllers/`
- Route entry in `routes/`
- Hook self-check (api-contract + architecture-drift + social-domain-boundary)

## Endpoint Implementation Sequence

```
1. Write Zod schema in validation/{domain}.validation.ts
2. Write repository query in repositories/{domain}.repository.ts
3. Write service function in services/{domain}.service.ts
4. Write controller in controllers/{domain}.controller.ts
5. Add route in routes/{domain}.routes.ts with middleware
6. Mount in routes/index.ts if new router
```

## Controller Template
```typescript
// controllers/{domain}.controller.ts
export const createPost = async (req: Request, res: Response) => {
  try {
    const validated = createPostSchema.parse(req.body)
    const result = await postService.createPost(req.profileId, validated)
    res.status(201).json({ data: result })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors })
    }
    next(error)
  }
}
```

## Route Template
```typescript
// routes/{domain}.routes.ts
const router = Router()
router.post('/', requireAuth, validateBody(createPostSchema), rateLimiter.posts, domainController.create)
router.get('/:id', optionalAuth, domainController.getById)
router.delete('/:id', requireAuth, domainController.remove)
export default router
```

## Authorization Pattern
```typescript
// In service — ownership check
async function deletePost(callerProfileId: string, postId: string) {
  const post = await postRepository.findById(postId)
  if (!post) throw new NotFoundError('Post not found')
  if (post.profileId !== callerProfileId) throw new ForbiddenError('Not your post')
  // proceed
}
```

## Standard Response Shapes
```typescript
// Success list
{ data: T[], meta: { nextCursor: string | null, hasMore: boolean } }

// Success single
{ data: T }

// Error
{ error: string, code: string, details?: unknown }

// Toggle action (like/follow)
{ data: { active: boolean, count: number } }
```

## Required for Every Mutating Endpoint
- [ ] `requireAuth` middleware
- [ ] Zod validation (`validateBody` wrapper)
- [ ] Rate limiting (via `rateLimiter.{action}`)
- [ ] Ownership check in service
- [ ] Idempotency (use `INSERT ... ON CONFLICT DO NOTHING` for toggles)

## Social Action Idempotency Pattern
```typescript
// Repository: idempotent insert
await db.insert(postLikes)
  .values({ profileId, postId })
  .onConflictDoNothing()

// Repository: idempotent delete
await db.delete(postLikes)
  .where(and(eq(postLikes.profileId, profileId), eq(postLikes.postId, postId)))
```

## References
- AGENT.md §6 (backend conventions)
- `.agent/hooks/HOOKS.md` → `architecture-drift`, `api-contract`, `social-domain-boundary`
