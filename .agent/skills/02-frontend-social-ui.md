# Skill: Frontend Social UI (`02-frontend-social-ui`)

**Type:** Implementation
**Use When:** Building any social-facing UI (feed, post card, profile, follow button, like/save, comment panel)

---

## Purpose
Build Next.js 15 social UI components correctly — with server/client split, optimistic updates, and all required states.

## Inputs Expected
- Feature name and domain
- API contract (endpoint, response shape)
- Route group (public or auth)

## Outputs Required
- Page file in correct route group
- Feature component(s) in `components/{domain}/`
- TanStack Query hook in `hooks/`
- API client function in `lib/api/`
- Loading, empty, and error states (NON-NEGOTIABLE)

## Server vs Client Decision

| Content type | Render strategy | Why |
|---|---|---|
| Feed first page | Server Component + RSC | SEO, fast FCP |
| Post detail | Server Component | OG meta, SEO |
| Public profile | Server Component | SEO |
| Feed infinite scroll | Client (after hydration) | TanStack infinite query |
| Like/save/follow buttons | Client | Optimistic mutations |
| Comment panel | Client | Interactive |
| Studio/generate | Client | Form-heavy |
| Notification bell | Client | Polling/realtime |

## Required Component Anatomy

Every social feature component must have:
```tsx
// 1. Loading state
if (isLoading) return <FeatureSkeleton />

// 2. Error state
if (error) return <ErrorState onRetry={refetch} message={...} />

// 3. Empty state
if (!data || data.length === 0) return <EmptyState ... />

// 4. Content
return <FeatureContent data={data} />
```

## Optimistic Update Pattern
```typescript
// Only for reversible toggles: like, save, follow
const mutation = useMutation({
  mutationFn: apiCall,
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey })
    const prev = queryClient.getQueryData(queryKey)
    queryClient.setQueryData(queryKey, optimisticUpdate)
    return { prev }
  },
  onError: (_, __, ctx) => queryClient.setQueryData(queryKey, ctx?.prev),
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
})
```

## Forbidden Patterns
- Direct Supabase calls from components
- Prompt visibility logic on the client
- OFFSET-based pagination
- Ownership checks on client-side data
- Inline fetch in page components (must use shared hooks)
- New pages without loading/empty/error states

## Route Group Rules
```
app/(public)/   → no auth required, SSR preferred
app/(auth)/     → protected by middleware.ts Clerk guard
app/admin/      → admin role required
```

## Accessibility Checklist
- [ ] All buttons have `aria-label`
- [ ] Images have alt text: "AI generated image by @{username}" or post title
- [ ] Modal has focus trap
- [ ] `prefers-reduced-motion` respected in animations
- [ ] Keyboard navigable

## References
- AGENT.md §7 (frontend conventions)
- `.agent/hooks/HOOKS.md` → `frontend-route-placement`
