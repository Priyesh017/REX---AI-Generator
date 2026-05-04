# Skill: Auth & Profile Flow (`05-auth-and-profile-flow`)

**Type:** Implementation + Advisory
**Use When:** Changing auth middleware, profile creation, Clerk webhook handling, or identity resolution
**Subagent:** `auth-guardian`

---

## Purpose
Correctly bridge Clerk identity with internal profile system. Protect the identity anchor pattern.

## Inputs Expected
- Which auth behavior is being changed
- Current middleware state (inspect `middleware/`)

## Outputs Required
- Updated/new middleware file
- Profile service changes if needed
- Verification that clerk_user_id is never used as social FK

## Identity Architecture [NON-NEGOTIABLE]

```
Clerk (external auth)
  └── clerk_user_id (TEXT)
         └── stored only in profiles.clerk_user_id
                └── profiles.id (UUID) ← ALL social relations point here
```

## requireAuth Middleware Pattern
```typescript
// middleware/requireAuth.ts
import { getAuth } from '@clerk/express'
import { profileRepository } from '../repositories/profile.repository'

const profileCache = new Map<string, { id: string; role: string; isBanned: boolean }>()

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId: clerkUserId } = getAuth(req)
  if (!clerkUserId) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })

  // Cache lookup (TTL managed externally or use LRU)
  let profile = profileCache.get(clerkUserId)
  if (!profile) {
    profile = await profileRepository.findByClerkId(clerkUserId)
    if (!profile) return res.status(404).json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' })
    profileCache.set(clerkUserId, profile)
  }

  if (profile.isBanned) return res.status(403).json({ error: 'Account suspended', code: 'BANNED' })

  req.profileId = profile.id          // UUID — use for ALL ownership checks
  req.clerkUserId = clerkUserId        // Clerk string — use only if Clerk API call needed
  req.role = profile.role
  next()
}
```

## requireRole Middleware Pattern
```typescript
// middleware/requireRole.ts
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' })
    }
    next()
  }
}
// Usage: router.get('/admin/...', requireAuth, requireRole('admin', 'moderator'), controller)
```

## Clerk Webhook Handler Pattern
```typescript
// Handle user.created → create profiles row
async function handleUserCreated(event: ClerkWebhookEvent) {
  const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = event.data
  const emailPrefix = email_addresses[0]?.email_address?.split('@')[0] ?? 'user'
  const baseUsername = emailPrefix.replace(/[^a-z0-9_]/gi, '').toLowerCase()
  const username = await profileRepository.generateUniqueUsername(baseUsername)

  await profileRepository.create({
    clerkUserId,
    username,
    displayName: [first_name, last_name].filter(Boolean).join(' ') || username,
    avatarUrl: image_url,
  })
}
```

## Audit Checklist for Auth Changes
```
Before any auth middleware change:
✅ req.profileId (UUID) still attached after change
✅ req.role still attached
✅ isBanned check still present
✅ No clerk_user_id used as FK in downstream code
✅ Profile cache invalidated if profile data changes
✅ Webhook handler is idempotent (re-running doesn't duplicate profiles)
```

## References
- AGENT.md §10 (Clerk identity rules)
- `.agent/subagents/ROLES.md` → `auth-guardian`
