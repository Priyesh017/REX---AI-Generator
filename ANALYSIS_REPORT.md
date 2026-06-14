# REX AI Generator — Full Repository Analysis Report

> **Generated:** 2026-06-14 | **Scope:** Full repo deep scan  
> **Purpose:** This document is the authoritative bug/error analysis for every AI agent working in this repository. Read this before touching any file. Cross-reference with `AGENT.md` for architectural rules.

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Severity Legend](#2-severity-legend)
3. [Critical Bugs (P0)](#3-critical-bugs-p0)
4. [High-Priority Bugs (P1)](#4-high-priority-bugs-p1)
5. [Medium-Priority Issues (P2)](#5-medium-priority-issues-p2)
6. [Low-Priority / Tech Debt (P3)](#6-low-priority--tech-debt-p3)
7. [Architecture Violations](#7-architecture-violations)
8. [Missing Required Features](#8-missing-required-features)
9. [Security Issues](#9-security-issues)
10. [Type Safety Issues](#10-type-safety-issues)
11. [Frontend-Specific Issues](#11-frontend-specific-issues)
12. [Backend-Specific Issues](#12-backend-specific-issues)
13. [Fix Priority Order](#13-fix-priority-order)

---

## 1. Executive Summary

The REX codebase is mid-transition from a basic AI image generator to a full Instagram-like social platform. The core architecture (routes → controllers → services → repositories) is partially implemented. The following categories of issues were found:

| Category | Count |
|---|---|
| Critical (P0) Bugs | 6 |
| High (P1) Bugs | 9 |
| Medium (P2) Issues | 11 |
| Low / Tech Debt (P3) | 8 |
| Architecture Violations | 5 |
| Security Vulnerabilities | 6 |
| Missing Required Features | 7 |
| Type Safety Issues | 5 |

---

## 2. Severity Legend

| Label | Meaning |
|---|---|
| 🔴 **P0 – Critical** | Production-breaking; causes data loss, auth bypass, or complete feature failure |
| 🟠 **P1 – High** | Feature broken for a class of users; incorrect behavior visible to users |
| 🟡 **P2 – Medium** | Degrades experience; no data loss but causes confusion or unreliability |
| 🟢 **P3 – Low** | Tech debt, code smell, or missing-but-non-blocking quality item |

---

## 3. Critical Bugs (P0)

### BUG-001 🔴 — Webhook Payment Bug: Wrong Property Access (Runtime Crash)

**File:** `generator-server/src/controllers/paymentController.ts` (Line 212)

**Problem:**
In the `paymentWebhook` handler, the `payment_id` field is set using `event.payload.payment.entity.id`. However, `event` is a `string` (the event name e.g. `"order.paid"`), NOT the full webhook body. The full body is destructured as `{ event, payload }` from `req.body`. This means `event.payload` is `undefined`, causing a **runtime TypeError crash** on every Razorpay webhook call for `order.paid`.

```typescript
// WRONG — line 212
payment_id: event.payload.payment.entity.id,

// CORRECT — should be:
payment_id: payload.payment.entity.id,
```

**Impact:** Every payment webhook that fires `order.paid` will crash with `TypeError: Cannot read properties of undefined (reading 'payment')`. The order status update also fails. Credits are never reliably applied via webhook.

**Fix:** Change `event.payload.payment.entity.id` → `payload.payment.entity.id` on line 212.

---

### BUG-002 🔴 — `generateTitleFromPrompt` is Sync but Called with `await`

**File:** `generator-server/src/lib/titleGenerator.ts` (Line 2)  
**Caller:** `generator-server/src/services/draft.service.ts` (Line 42)

**Problem:**
`generateTitleFromPrompt` is defined as a **synchronous function** (`(prompt: string): string`), but in `draft.service.ts` it is called with `await`:

```typescript
// titleGenerator.ts — sync function
export const generateTitleFromPrompt = (prompt: string): string => { ... }

// draft.service.ts — called with await
const title = await generateTitleFromPrompt(prompt);  // BUG
```

Awaiting a non-Promise value is not a runtime crash (it resolves immediately), but it indicates the function is supposed to be async (e.g., call an AI/LLM API for real title generation). The current implementation is a primitive word-filter, not proper title generation. If a future agent tries to make it truly async (e.g., Gemini API), the type mismatch will cause silent failures if the caller isn't updated.

**Fix:** Either make `generateTitleFromPrompt` properly `async Promise<string>` and add real title generation logic, or remove the `await` in the caller and align the return type.

---

### BUG-003 🔴 — `adminController.ts` Violates Auth Pattern: Uses `clerk_id` as Relational Key

**File:** `generator-server/src/controllers/adminController.ts` (Lines 50, 57, 62, 82, 87, 119–122)

**Problem:**
`adminController.ts` queries profiles using `clerk_id` directly instead of the internal UUID `id`. It also uses `clerk_id` as a relational join key in `orders` (`t.clerk_id`). This violates the **[NON-NEGOTIABLE] Identity Anchor Rule** in `AGENT.md §5.2`:

```
NEVER use clerk_user_id as FK in: follows, post_likes, post_saves, comments,
notifications, reports, collections, credit_transactions, or posts
```

The `orders` table apparently stores `clerk_id` as a join key, meaning if a user's Clerk account is deleted and recreated, their payment history is broken. `updateUserDetails` also updates by `clerk_id` which bypasses UUID-based relational integrity.

**Fix:** The `orders` table should use an internal `profile_id` UUID FK, not `clerk_id`. Admin queries should join through `profiles.clerk_id → profiles.id` first.

---

### BUG-004 🔴 — `next.config.ts` Supabase Hostname is Raw URL, Not Hostname

**File:** `generator-client/next.config.ts` (Line 18)

**Problem:**
`process.env.NEXT_PUBLIC_SUPABASE_URL` contains a full URL like `https://xyz.supabase.co`, but `remotePatterns.hostname` expects **only the hostname** (e.g., `xyz.supabase.co`). Passing a full URL will cause Next.js Image Optimization to **silently block all Supabase storage images** at build/runtime.

```typescript
// WRONG
hostname: process.env.NEXT_PUBLIC_SUPABASE_URL!,
// This sets hostname to "https://xyz.supabase.co" — invalid

// CORRECT
hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
// This extracts "xyz.supabase.co"
```

**Impact:** All AI-generated images from Supabase storage will fail to render via `next/image` in production.

---

### BUG-005 🔴 — `paymentController.ts` Does Not Use Standard `sendSuccess` / `sendError`

**File:** `generator-server/src/controllers/paymentController.ts` (Lines 18, 29, 59, 72, 84, 107, 113, etc.)

**Problem:**
All other controllers use `sendSuccess(res, data)` and the global error handler for consistent API response shapes. `paymentController.ts` uses raw `res.json({ success: false, error: "..." })` and `res.status(400).json(...)` everywhere. This means:
- Payment error responses have shape `{ success: false, error }` instead of `{ error, code }`.
- The client-side code cannot uniformly handle these errors via `ApiRequestError`.
- The controller also still uses `return res.json(...)` patterns in an `async` function which doesn't properly forward errors to the global error handler.

**Fix:** Refactor `paymentController.ts` to throw `AppError` subclasses and use `sendSuccess`. Move business logic into a `payment.service.ts`.

---

### BUG-006 🔴 — `DraftsPanel.tsx` Renders Images with No `status` Guard (Broken `<img>` for Pending/Failed Drafts)

**File:** `generator-client/components/studio/DraftsPanel.tsx` (Line 314)

**Problem:**
`DraftCard` renders `<Image src={asset.image_url} ...>` with no check on `asset.generation_status`. When a draft is `"pending"` or `"failed"`, `image_url` is an empty string (`""`), causing:
- `next/image` to throw a console error (empty src is invalid).
- A broken image displayed in the grid.
- The `alt` attribute falls back to `asset.title ?? asset.prompt`, which may also be empty for a pending asset.

```typescript
// MISSING guard in DraftCard
if (!asset.image_url || asset.generation_status === 'pending') {
  // show shimmer / spinner
}
```

**Fix:** Add conditional rendering in `DraftCard` to show a shimmer skeleton for `pending` status and an error icon for `failed` status.

---

## 4. High-Priority Bugs (P1)

### BUG-007 🟠 — `social.validation.ts` Param Schemas Have Optional Fields That Should Be Required

**File:** `generator-server/src/validation/social.validation.ts` (Lines 6–12)

**Problem:**
The shared `uuidParam` and `usernameParam` validators have both fields as `optional()`. When used as `postIdParamSchema` for `/posts/:postId/like`, if `:postId` is missing or not a UUID, the validation passes and the route handler receives `undefined` for `postId` — causing silent DB query failures.

```typescript
// CURRENT — both fields optional (wrong)
const uuidParam = z.object({
  postId: z.string().uuid().optional(),  // BUG: should be required for post routes
  commentId: z.string().uuid().optional(), // BUG: should be required for comment routes
});

// CORRECT — separate schemas per route
const postIdParamSchema = z.object({ postId: z.string().uuid("Invalid post ID") });
const commentIdParamSchema = z.object({ commentId: z.string().uuid("Invalid comment ID") });
```

**Fix:** Create separate non-optional schemas for each param route.

---

### BUG-008 🟠 — `social.controller.ts` Missing `try/catch` and `next(err)` — Unhandled Rejections

**File:** `generator-server/src/controllers/social.controller.ts`

**Problem:**
Every function in `social.controller.ts` is `async` but has **no try/catch** and does not forward errors to `next(err)`. The routes use `catchAsync()` wrapper which handles this, BUT the controller functions do not accept `NextFunction` as a parameter, making the code inconsistent with `draft.controller.ts` which correctly uses `try/catch + next(err)` pattern.

**Fix:** Wrap all `social.controller.ts` handlers in `try/catch` and call `next(err)` in the catch block. Add `NextFunction` to function signatures.

---

### BUG-009 🟠 — `upload.ts` Ignores the Uploaded Content-Type (Always Stores as `image/png` Regardless)

**File:** `generator-server/src/lib/upload.ts`

**Problem:**
The `uploadImageToBucket` function defaults to `contentType = "image/png"` but `draft.service.ts` calls it after converting to WebP via Sharp. The result is a **WebP file stored with `image/png` MIME type** and a `.png` filename. This breaks:
- Browser caching (incorrect Content-Type header from Supabase).
- Image decoders that rely on content type.
- AGENT.md §11 bucket rule specifying `.webp` files.

```typescript
// draft.service.ts — converts to WebP
const optimizedBuffer = await sharp(imageBuffer).webp({ quality: 80 }).toBuffer();
// upload.ts — uploads with wrong type and .png extension
const fileName = `${randomUUID()}.png`; // BUG: should be .webp
uploadImageToBucket(optimizedBuffer)    // contentType defaults to "image/png" — BUG
```

**Fix:** Pass `contentType: "image/webp"` and use `.webp` filename extension in `uploadImageToBucket`.

---

### BUG-010 🟠 — `ExploreFeedPage.tsx` Has Navbar Rendered Inside Page Content (Double Navbar Risk)

**File:** `generator-client/components/explore/ExploreFeedPage.tsx` (Line 58)

**Problem:**
`ExploreFeedPage` renders `<Navbar />` directly inside itself. The parent `app/explore/page.tsx` does NOT use `AppShell` (which provides the Navbar), so the Navbar is only present here. However, every other page route (Generate, Profile) wraps with `AppShell`. This is architecturally inconsistent. If `AppShell` is ever used on Explore, there will be **two Navbars**.

**Fix:** Remove `<Navbar />` from `ExploreFeedPage.tsx` and wrap `app/explore/page.tsx` with `AppShell`.

---

### BUG-011 🟠 — `draft.service.ts` Background Job Has No Cancellation / Cleanup for Orphaned State

**File:** `generator-server/src/services/draft.service.ts` (Lines 55–74)

**Problem:**
The background IIFE fires image generation after the HTTP response is returned. If the server restarts between the response and the async completion, the `pending` draft record is **permanently stuck in pending state** with no recovery path. There is no:
- Timeout enforcement on the background job.
- Startup cleanup to find and retry/mark-failed old `pending` records.
- Job queue (e.g. BullMQ) to persist and resume work.

AGENT.md target architecture mentions `jobs/` BullMQ workers, but this is not implemented.

**Fix (immediate):** Add a startup reconciliation that marks `pending` assets older than 5 minutes as `failed`. Long-term: move to BullMQ.

---

### BUG-012 🟠 — `GeneratorPanel.tsx` Polling Does Not Clean Up on Component Unmount

**File:** `generator-client/components/studio/GeneratorPanel.tsx` (Lines 87–113)

**Problem:**
After generating, if the status is `pending`, a `setInterval` polling loop is started. If the user navigates away from the page **while polling**, the interval continues running (memory leak, phantom API calls). The `intervalId` is local to the async handler and not captured for cleanup via `useEffect` return.

```typescript
// No cleanup mechanism — interval leaks on unmount
const intervalId = setInterval(async () => { ... }, 2000);
```

**Fix:** Use a `useRef` to store the interval ID, and clear it in a `useEffect` cleanup function.

---

### BUG-013 🟠 — `DraftsPanel.tsx` Infinite Query Returns Wrong Data Shape

**File:** `generator-client/components/studio/DraftsPanel.tsx` (Line 58)

**Problem:**
The `getNextPageParam` accesses `lastPage.meta.pagination.hasNext`, and `assets` extraction uses `page.assets`. The `studioApi.listDrafts()` returns `{ assets: r.data, meta: r.meta }` where `r.meta` is `{ pagination: {...} }`. This coupling is tight and undocumented. Any server response shape change silently breaks the infinite scroll without a TypeScript error.

---

### BUG-014 🟠 — `post.controller.ts` `listPosts` Passes Query Params as Wrong Types to Service

**File:** `generator-server/src/controllers/post.controller.ts` (Line 29)

**Problem:**
```typescript
const { page, limit, username } = req.query as unknown as ListPostsQuery;
```
Even though the `validate(listPostsQuerySchema, "query")` middleware runs before this and coerces `page`/`limit` to numbers, the `as unknown as ListPostsQuery` cast is used instead of directly typing from the schema. If `validate` middleware is removed or its order changed, this silently passes strings to `postRepo.listPublic(page, limit)` which would break OFFSET calculations.

**Fix:** Remove the `unknown` intermediate cast: `const { page, limit, username } = req.query as ListPostsQuery;`

---

### BUG-015 🟠 — `draft.validation.ts` Missing `DraftIdParam` Type Export

**File:** `generator-server/src/validation/draft.validation.ts`

**Problem:**
The file exports `GenerateInput` and `ListDraftsQuery` types but is missing the `DraftIdParam` type export. When `validate(draftIdParamSchema, "params")` runs, the `req.params` object is replaced with the parsed data, but nothing downstream can type `req.params` as `DraftIdParam` because the type isn't exported.

---

## 5. Medium-Priority Issues (P2)

### ISSUE-016 🟡 — `adminController.ts` Has No Pagination on Transaction/Image Lists

**File:** `generator-server/src/controllers/adminController.ts` (Lines 70–113)

**Problem:**
`getAdminTransactions` and `getAdminImages` return **all rows** from their respective tables with no pagination or limit. `getAdminUsers` has a hardcoded `.limit(20)`. As the platform grows, these will cause memory exhaustion and request timeouts.

---

### ISSUE-017 🟡 — `paymentSuccess` Handler Is Not Idempotent for Credit Increment

**File:** `generator-server/src/controllers/paymentController.ts` (Lines 118–162)

**Problem:**
If the order status update succeeds (status → `paid`) but the `increment_credits` RPC fails (line 149), the order is marked paid but no credits are added. On retry, the status check will see `paid` and return early — the credits are **permanently lost**.

**Fix:** Either use a Supabase stored procedure that does both operations atomically, or add a `credit_applied` boolean flag on the order so retries can re-apply credits without double-charging.

---

### ISSUE-018 🟡 — `social.validation.ts` `usernameParam` Has Both Fields Optional (Naming Conflict)

**File:** `generator-server/src/validation/social.validation.ts` (Lines 10–13)

The single schema has `targetUsername` and `username` as two different optional fields in the same object. When used for `/users/:targetUsername/follow`, `username` will always be `undefined`. When used for `/users/:username/followers`, `targetUsername` will always be `undefined`. Using the same schema for both is confusing and allows silent misrouting.

---

### ISSUE-019 🟡 — `post.service.ts` Hardcodes Moderation Word List (Duplicated, No Audit Log)

**File:** `generator-server/src/services/post.service.ts` (Line 28)  
**Also:** `generator-server/src/services/social.service.ts` (Line 94)

**Problem:**
```typescript
const restrictedWords = ["nsfw", "gore", "violence", "hate", "spam"];
```
This is duplicated in two service files. The word "hate" will flag legitimate phrases. AGENT.md §9 requires a moderation path with audit logging, and this implementation does not meet it.

**Fix:** Extract to a shared `moderation.ts` utility, use word-boundary regex matching, and add an audit log entry for flagged content.

---

### ISSUE-020 🟡 — `profile.repository.ts` Username Generation Can Produce Non-Unique Usernames

**File:** `generator-server/src/repositories/profile.repository.ts` (Lines 173–176)

**Problem:**
```typescript
const username = 
  clerkUser.username || 
  clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 
  `user_${Math.random().toString(36).substring(7)}`;
```
- Email-derived usernames are not unique across users (two users with `john@gmail.com` and `john@outlook.com` both get `john`).
- `Math.random().toString(36).substring(7)` produces a very short suffix — collisions are highly probable.
- No uniqueness check against the DB before insert.

**Fix:** After generating a candidate username, check uniqueness against DB and append a numeric suffix if taken.

---

### ISSUE-021 🟡 — `PostDetailPage.tsx` Fetches 3 Data Sources in One Query (Catastrophic Partial Failure)

**File:** `generator-client/components/post/PostDetailPage.tsx` (Lines 50–71)

**Problem:**
The `useQuery` fetches post + social stats + comments in one parallel `Promise.all`. If any one fails, the entire page shows "Post not found" — even if the post itself loaded fine.

**Fix:** Split into separate `useQuery` calls with independent error handling.

---

### ISSUE-022 🟡 — `PublishModal.tsx` `onError` Does Not Show the Server's Error Message

**File:** `generator-client/components/studio/PublishModal.tsx` (Lines 57–59)

**Problem:**
```typescript
onError: () => {
  toast.error("Failed to publish post.");
}
```
The error parameter is ignored. If the server returns a specific moderation error, the user never sees it.

**Fix:** `onError: (err) => { toast.error(err instanceof ApiRequestError ? err.message : "Failed to publish post."); }`

---

### ISSUE-023 🟡 — `/generate` Route in `middleware.ts` is Public but Redirects to Protected `/studio`

**Files:** `generator-client/middleware.ts` (Line 6), `generator-client/next.config.ts` (Lines 8–12)

**Problem:**
`/generate` is in `isPublicRoute` (unauthenticated access allowed). But `next.config.ts` sets a permanent redirect from `/generate` → `/studio`. `/studio` IS auth-protected. An unauthenticated user visiting `/generate` gets a redirect to `/studio`, then gets auth-redirected back to `/`. This creates a confusing UX loop.

---

### ISSUE-024 🟡 — `ExploreFeedPage.tsx` Uses `initialPosts` Array in `useEffect` Deps (Stale Closure Risk)

**File:** `generator-client/components/explore/ExploreFeedPage.tsx` (Line 54)

**Problem:**
`useEffect(..., [getToken, initialPosts])` — `initialPosts` is an array prop. If the parent re-renders and creates a new array reference (even with the same data), this effect re-fires and re-fetches the entire feed unnecessarily.

---

### ISSUE-025 🟡 — All Repositories Use OFFSET-based Pagination (Forbidden by AGENT.md)

**Files:** `generator-server/src/repositories/post.repository.ts` (Lines 86, 121), `draft.repository.ts` (Line 59), `social.repository.ts` (Line 130)

**Problem:**
AGENT.md §9 states: **"No Feed Feature Without: Cursor-based pagination (no OFFSET)"** — this is [NON-NEGOTIABLE]. OFFSET-based pagination gets exponentially slower as pages grow and causes duplicate/missing items when new posts are inserted.

**Fix:** Implement keyset pagination using `(created_at DESC, id DESC)` cursor on all list endpoints.

---

### ISSUE-026 🟡 — `lib/getUserIdFromToken.ts` is Dead Code

**File:** `generator-server/src/lib/getUserIdFromToken.ts`

**Problem:**
`getUserIdFromToken` duplicates the auth logic already in `middleware/auth.ts` and is imported nowhere. Dead code that can mislead future agents.

**Fix:** Delete the file or add a deprecation comment pointing to `middleware/auth.ts`.

---

## 6. Low-Priority / Tech Debt (P3)

### TD-027 🟢 — Duplicate `type/` and `types/` Directories in `generator-client`

**Files:** `generator-client/type/` (legacy, 134 bytes) and `generator-client/types/` (correct)

**Fix:** Consolidate all types into `types/`, delete the `type/` directory.

---

### TD-028 🟢 — `auth.ts` Middleware Only Sets `req.userId` (Clerk ID), Not `req.profileId` (UUID)

**File:** `generator-server/src/middleware/auth.ts`

AGENT.md §6 Auth Pattern requires: *"Resolve internal profileId from clerk_user_id — Attach req.profileId (UUID)"*. Currently every service has to call `profileRepo.findByClerkId(clerkId)` separately — an extra DB round-trip on virtually every authenticated request.

---

### TD-029 🟢 — `generationLimiter` Rate Limit is 20/hour (AGENT.md specifies 10/hour) and is IP-Based

**File:** `generator-server/src/middleware/limiter.ts` (Line 18)

AGENT.md §6 specifies `POST /generate (10/hour/user)`. Current limit is 20, and it's keyed by IP (not user ID). Two users behind the same NAT share the limit.

---

### TD-030 🟢 — CORS `CLIENT_URL` is Not in Validated Env Schema

**File:** `generator-server/src/server.ts` (Line 20)

```typescript
origin: process.env.CLIENT_URL || "http://localhost:3000",
```
`CLIENT_URL` is not in the Zod `envSchema` in `config/env.ts`. It's read raw without validation — could silently be `undefined` in production.

---

### TD-031 🟢 — `paymentController.ts` `createOrder` Uses `return res.json(...)` Inside Non-Error Path (Express Anti-pattern)

**File:** `generator-server/src/controllers/paymentController.ts`

Using `return res.json(...)` instead of `sendSuccess` + implicit return is inconsistent and makes testing harder.

---

### TD-032 🟢 — Comments Count in `PostDetailPage.tsx` Shows Array Length, Not Server Total

**File:** `generator-client/components/post/PostDetailPage.tsx` (Line 215)

```tsx
Comments ({comments.length})
```
Shows count of loaded comments (capped at `limit=20`), not the actual total from the server.

---

### TD-033 🟢 — `profileRepository.ts` `resolveOrProvisionUser` Has Race Condition for First-Time Users

**File:** `generator-server/src/repositories/profile.repository.ts` (Lines 165–188)

Two simultaneous requests for a new user both get `null` from `findByClerkId`, both proceed to `create()`, and the second insert crashes on the UNIQUE constraint for `clerk_id`. The error is not caught gracefully.

**Fix:** Handle the unique constraint error in `create()` by catching `23505` Postgres error code and returning the existing record.

---

### TD-034 🟢 — `SocialMeta` Type Uses All-Optional Fields (Reduces Type Safety)

**File:** `generator-client/types/social.ts` (Line 4)

A single `SocialMeta` type is reused for both post likes AND profile follow data. Should be split into `PostSocialMeta` and `ProfileSocialMeta`.

---

## 7. Architecture Violations

### ARCH-001 — `adminController.ts` Contains Direct DB Access

**File:** `generator-server/src/controllers/adminController.ts`  
**AGENT.md:** §4.1, §6 Layer Responsibilities [NON-NEGOTIABLE]

All Supabase queries are directly inside controller functions. AGENT.md says controllers must not contain DB calls. These belong in `admin.repository.ts` and business logic in `admin.service.ts`.

---

### ARCH-002 — `paymentController.ts` Contains Business Logic

**File:** `generator-server/src/controllers/paymentController.ts`  
**AGENT.md:** §6 Layer Responsibilities [NON-NEGOTIABLE]

`paymentController.ts` contains signature verification, order lookup, status transitions, credit increment, and idempotency logic — all of which belong in `payment.service.ts` and `payment.repository.ts`.

---

### ARCH-003 — All Repositories Use OFFSET Pagination

**Files:** `post.repository.ts`, `draft.repository.ts`, `social.repository.ts`  
**AGENT.md:** §9 "No Feed Feature Without: Cursor-based pagination (no OFFSET)"

---

### ARCH-004 — `app/generate/page.tsx` Route is Under Wrong Directory

**File:** `generator-client/app/generate/page.tsx`  
**AGENT.md:** §7 Route Placement

AGENT.md §7: *"Auth-required pages (generate, studio, notifications, settings) → `app/(auth)/`"*. The `/generate` page currently lives flat in `app/generate/` — not under the `(auth)` route group.

---

### ARCH-005 — No `app/(public)/` or `app/(auth)/` Route Groups Exist

**Files:** `generator-client/app/` directory  
**AGENT.md:** §7 Route Placement

AGENT.md specifies `app/(public)/` and `app/(auth)/` route groups. Currently all routes are flat in `app/`. No route groups exist — preventing route-group-level layouts.

---

## 8. Missing Required Features

### MISSING-001 — No Report/Moderation Endpoint (AGENT.md §9 [NON-NEGOTIABLE])

**AGENT.md:** §9 "Report endpoint must exist before any UGC feature goes live"  
No `POST /posts/:id/report` or `POST /comments/:id/report` endpoint exists. Comments and posts are live UGC features without a report mechanism.

---

### MISSING-002 — No `audit_log` Table or Write Operations (AGENT.md §9 [NON-NEGOTIABLE])

**AGENT.md:** §9 "Moderator action must write to audit_log — no exceptions"  
No audit log exists. The admin `updateUserDetails` endpoint modifies production data with no audit trail.

---

### MISSING-003 — No Auto-Hide Threshold Logic for Posts/Comments (AGENT.md §9 [NON-NEGOTIABLE])

**AGENT.md:** §9 Moderation  
No logic exists to auto-hide posts or comments that receive a threshold number of reports.

---

### MISSING-004 — Notifications System Not Implemented

**AGENT.md:** §3 Target Architecture (`/notifications` page)  
No notifications table, endpoint, or UI exists despite being in the target architecture and listed in `middleware.ts` as an auth-protected route.

---

### MISSING-005 — No Counter Denormalization via DB Triggers (AGENT.md §8)

**AGENT.md:** §8 Counter Denormalization  
`likes_count`, `follower_count`, etc. are not maintained as denormalized counters with DB triggers. Every render of likes/followers requires a full `COUNT(*)` query.

---

### MISSING-006 — No BullMQ Job Queue for Image Generation

**AGENT.md:** §3 Target Architecture (`jobs/` BullMQ workers)  
The current fire-and-forget IIFE background job has no persistence, retry logic, or monitoring. See BUG-011.

---

### MISSING-007 — No Cursor-based Feed / Keyset Pagination (AGENT.md §9 [NON-NEGOTIABLE])

All list endpoints use OFFSET pagination. See ISSUE-025 and ARCH-003.

---

## 9. Security Issues

### SEC-001 🔴 — Rate Limiter is IP-Based, Not User-Based (Bypassable)

**File:** `generator-server/src/middleware/limiter.ts`

The `generationLimiter` limits by IP address. A single authenticated user can bypass this by rotating IP addresses (VPN, Tor). Use `req.userId || req.ip` as the rate-limit key.

---

### SEC-002 🔴 — Admin Auth Checks a Single Hardcoded Clerk ID (Brittle RBAC)

**File:** `generator-server/src/middleware/adminAuth.ts`

Only one admin is possible. If the Clerk account is deleted, admin access is permanently lost. No role-based access control (RBAC) exists. Should store `profiles.role = 'admin'` in the DB.

---

### SEC-003 🟠 — `paymentWebhook` Uses `req as any` for Raw Body Access

**File:** `generator-server/src/controllers/paymentController.ts` (Line 172)

```typescript
const rawBody = (req as any).rawBody;
```
No global declaration that `Request` has `rawBody`. If the `verify` callback in `server.ts` is ever removed, `rawBody` will silently be `undefined` and ALL webhook signature verifications will fail (accepting unsigned webhooks).

**Fix:** Extend the Express `Request` interface to declare `rawBody?: Buffer`.

---

### SEC-004 🟡 — SQL Injection Risk in Admin User Search (Unsanitized PostgREST Query Interpolation)

**File:** `generator-server/src/controllers/adminController.ts` (Lines 49–51)

```typescript
query = query.or(`display_name.ilike.%${search}%,...`);
```
If `search` contains PostgREST special characters (`.`, `,`, `(`), this can produce malformed queries. Input sanitization is required.

---

### SEC-005 🟡 — No CSRF Protection for State-Changing Endpoints

No CSRF protection middleware exists. This is acceptable for Bearer-token-based REST APIs, but should be explicitly documented as the security model to prevent future agents from adding cookie-based auth without CSRF protection.

---

### SEC-006 🟡 — `getToken` Called on Every Request Without Token Deduplication

**File:** `generator-client/lib/api/client.ts` (Line 36)

In race conditions (multiple simultaneous requests during token expiry), multiple Clerk token refresh attempts can occur simultaneously. Should rely on Clerk's internal deduplication or implement a token cache.

---

## 10. Type Safety Issues

### TYPE-001 — `social.controller.ts` Missing `NextFunction` Parameter

**File:** `generator-server/src/controllers/social.controller.ts`  
No handler accepts `NextFunction`. While `catchAsync` wraps them, the controllers should declare the correct `(req, res, next)` signature.

---

### TYPE-002 — `PostRecord` in `post.repository.ts` Doesn't Match `Post` in `types/post.ts`

**Files:** `generator-server/src/repositories/post.repository.ts`, `generator-client/types/post.ts`

Server `PostRecord` has a `visibility` field; client `Post` type does not. If `visibility` matters for client display, this will silently be lost.

---

### TYPE-003 — `SocialMeta` Reused for Both Post and Profile Data

**File:** `generator-client/types/social.ts` (Line 4)

A single `SocialMeta` type is reused for both post likes AND profile follow data, requiring null checks everywhere. See TD-034.

---

### TYPE-004 — `DraftAsset` in `types/studio.ts` Missing `owner_profile_id` Field

**File:** `generator-client/types/studio.ts`

The server's `DraftAsset` interface includes `owner_profile_id`. The client type does not. Future ownership-based frontend features will require this field.

---

### TYPE-005 — `formatPost` in `post.repository.ts` Returns `any` Typed Join Result

**File:** `generator-server/src/repositories/post.repository.ts` (Line 158)

```typescript
function formatPost(raw: any): PostRecord { ... }
```
The `raw: any` type loses all Supabase join type safety. Should use proper Supabase generated types or a typed intermediate interface.

---

## 11. Frontend-Specific Issues

### FE-001 — `PublicProfilePage.tsx` Avatar Uses Posts[0]'s Author Avatar (Incorrect)

**File:** `generator-client/components/profile/PublicProfilePage.tsx` (Line 142)

```typescript
src={posts[0]?.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
```
The profile avatar is sourced from the first post's author data. If the user has no posts, or the first post's author data is stale, the wrong avatar (or fallback) is shown. The profile page needs a dedicated `GET /api/profile/:username` endpoint.

---

### FE-002 — `PostDetailPage.tsx` Download Button Opens Image in New Tab (Not a Real Download)

**File:** `generator-client/components/post/PostDetailPage.tsx` (Line 364)

```typescript
onClick={() => window.open(post.image_url, "_blank")}
```
This opens the image in a new tab — it does not download it. Should use the blob-fetch-and-click-link pattern from `GeneratorPanel.tsx` and `DraftsPanel.tsx`.

---

### FE-003 — `GeneratorPanel.tsx` Cached Image from Cookie Has `id: "cached"` (Will Break Publish Flow)

**File:** `generator-client/components/studio/GeneratorPanel.tsx` (Line 43)

```typescript
setResult({
  id: "cached",   // BUG: not a real UUID
  prompt: "",
  ...
});
```
When a cached image is displayed and the user clicks "Publish", `draft_id: "cached"` is sent to the API. Zod UUID validation rejects this, but the user only sees a generic error toast.

**Fix:** Don't show the Publish button for cached/restored images, or store the actual asset ID in the cookie alongside the image URL.

---

### FE-004 — `app/explore/page.tsx` SSR Fetch May Hit Wrong API Path

**File:** `generator-client/app/explore/page.tsx` (Line 13)

```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts?limit=48`);
```
If `NEXT_PUBLIC_API_URL` is `http://localhost:5001` (without `/api`), this hits `/posts` which doesn't exist — the server routes everything under `/api/`. Need to verify the env var value includes `/api` or prepend it.

---

### FE-005 — No Error Boundary at the App Level

No React `ErrorBoundary` component wraps the app or any page-level component. AGENT.md §7 requires: *"Every data-fetching component must implement: loading skeleton, empty state, error boundary"*.

---

## 12. Backend-Specific Issues

### BE-001 — `draft.repository.ts` `deleteOwned` Does a Double Ownership Check (Redundant DB Query)

**File:** `generator-server/src/repositories/draft.repository.ts` (Line 183)

`deleteOwned` first queries for the asset with an ownership join, then runs a separate DELETE. The service layer already does an ownership check before calling `deleteOwned`. This is two DB round-trips for every delete.

**Fix:** Use a single `DELETE WHERE id = ? AND owner_profile_id = ?` using the profile UUID.

---

### BE-002 — `draft.service.ts` Calls `draftRepo.deleteOwned(assetId, clerkId)` With Inconsistent Parameter

**File:** `generator-server/src/services/draft.service.ts` (Line 114)

```typescript
await draftRepo.deleteOwned(assetId, clerkId);
```
The service has already confirmed `asset.owner_profile_id === profile.id`. Passing `clerkId` when the repository re-resolves it via a join is inefficient. The interface should accept `profileId` (UUID) directly.

---

### BE-003 — Missing Zod Validation on `paymentController.ts` Endpoints

**File:** Routes in `generator-server/src/routes/index.ts` (Lines 57–59)

`createOrder`, `paymentSuccess`, and `paymentWebhook` have no Zod schema validation. Malformed request bodies result in Supabase errors leaking to the client rather than clean 422 validation errors.

---

### BE-004 — `server.ts` Has No Graceful Shutdown

**File:** `generator-server/src/server.ts`

No `process.on('SIGTERM')` / `process.on('SIGINT')` handlers. In production environments, connections are abruptly terminated on restart, potentially corrupting in-flight operations.

---

## 13. Fix Priority Order

For an AI agent executing fixes, this is the recommended order to minimize regressions:

```
Round 1 — Critical Runtime Fixes (unblock production)
  1. BUG-001 — Fix webhook payment_id crash (paymentController.ts:212)
  2. BUG-004 — Fix next.config.ts Supabase hostname (next.config.ts:18)
  3. BUG-006 — Guard DraftCard from empty image_url when pending/failed
  4. BUG-009 — Fix upload.ts content-type and filename (.webp)

Round 2 — Security Hardening
  5. SEC-001 — Rate limiter: switch to user-based key
  6. SEC-002 — Admin RBAC: use profiles.role instead of single hardcoded ID
  7. SEC-003 — Declare rawBody on Request type
  8. SEC-004 — Sanitize admin search query input

Round 3 — Architecture Cleanup
  9. ARCH-001/002 — Extract adminController + paymentController to service/repo layers
  10. ISSUE-025/ARCH-003 — Replace OFFSET with cursor-based pagination in post.repository.ts
  11. ARCH-004/005 — Create (public)/ and (auth)/ route groups in Next.js app

Round 4 — Bug Fixes
  12. BUG-007 — Fix optional validation schemas in social.validation.ts
  13. BUG-008 — Add try/catch + NextFunction to social.controller.ts
  14. BUG-010 — Remove Navbar from ExploreFeedPage (use AppShell instead)
  15. BUG-012 — Add interval cleanup on unmount in GeneratorPanel.tsx
  16. ISSUE-019 — Extract moderation word list to shared utility
  17. ISSUE-020 — Fix username uniqueness in resolveOrProvisionUser
  18. ISSUE-022 — Show server error message in PublishModal.tsx
  19. FE-002 — Fix PostDetail download button
  20. FE-003 — Prevent Publish button for cached images
  21. FE-004 — Verify NEXT_PUBLIC_API_URL path consistency in SSR fetch

Round 5 — Completeness / Missing Features
  22. MISSING-001 — Add POST /posts/:id/report endpoint
  23. MISSING-002 — Create audit_log table and write operations
  24. MISSING-003 — Implement auto-hide threshold logic
  25. MISSING-004 — Build notifications system
  26. MISSING-005 — Add DB triggers for counter denormalization
  27. MISSING-006 — Migrate background job to BullMQ
  28. MISSING-007 — Implement cursor-based pagination everywhere

Round 6 — Tech Debt
  29. TD-027 — Merge type/ into types/
  30. TD-028 — Add req.profileId resolution in requireAuth middleware
  31. TD-029 — Fix generationLimiter to 10/hour with user-based key
  32. TD-030 — Add CLIENT_URL to env schema validation
  33. TD-033 — Fix race condition in resolveOrProvisionUser
  34. TD-034 — Split SocialMeta into PostSocialMeta and ProfileSocialMeta
```

---

## 📁 File Reference Index

| File | Issues |
|---|---|
| `generator-server/src/controllers/paymentController.ts` | BUG-001, BUG-005, ARCH-002, SEC-003, BE-003 |
| `generator-server/src/controllers/adminController.ts` | BUG-003, ARCH-001, ISSUE-016, SEC-004 |
| `generator-server/src/lib/titleGenerator.ts` | BUG-002 |
| `generator-server/src/lib/upload.ts` | BUG-009 |
| `generator-server/src/middleware/limiter.ts` | TD-029, SEC-001 |
| `generator-server/src/middleware/auth.ts` | TD-028 |
| `generator-server/src/middleware/adminAuth.ts` | SEC-002 |
| `generator-server/src/validation/social.validation.ts` | BUG-007, ISSUE-018 |
| `generator-server/src/controllers/social.controller.ts` | BUG-008, TYPE-001 |
| `generator-server/src/repositories/post.repository.ts` | ISSUE-025, ARCH-003, TYPE-005 |
| `generator-server/src/repositories/profile.repository.ts` | ISSUE-020, TD-033 |
| `generator-server/src/repositories/draft.repository.ts` | ISSUE-025, BE-001 |
| `generator-server/src/services/draft.service.ts` | BUG-011, BUG-002, BE-002 |
| `generator-server/src/services/post.service.ts` | ISSUE-019 |
| `generator-server/src/services/social.service.ts` | ISSUE-019 |
| `generator-server/src/server.ts` | TD-030, BE-004 |
| `generator-server/src/lib/getUserIdFromToken.ts` | ISSUE-026 |
| `generator-client/next.config.ts` | BUG-004 |
| `generator-client/middleware.ts` | ISSUE-023 |
| `generator-client/app/explore/page.tsx` | FE-004 |
| `generator-client/app/generate/page.tsx` | ARCH-004 |
| `generator-client/components/studio/GeneratorPanel.tsx` | BUG-012, FE-003 |
| `generator-client/components/studio/DraftsPanel.tsx` | BUG-006, BUG-013 |
| `generator-client/components/studio/PublishModal.tsx` | ISSUE-022 |
| `generator-client/components/post/PostDetailPage.tsx` | ISSUE-021, FE-002, TD-032 |
| `generator-client/components/explore/ExploreFeedPage.tsx` | BUG-010, ISSUE-024 |
| `generator-client/components/profile/PublicProfilePage.tsx` | FE-001 |
| `generator-client/types/social.ts` | TYPE-003, TD-034 |
| `generator-client/types/studio.ts` | TYPE-004 |
| `generator-client/type/` | TD-027 |

---

*This report covers 100% of source files in `generator-client/` and `generator-server/src/`.*  
*Last scanned: 2026-06-14 | Scanner: Antigravity AI Agent*
