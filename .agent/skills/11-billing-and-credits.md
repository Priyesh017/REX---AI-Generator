# Skill: Billing & Credits (`11-billing-and-credits`)

**Type:** Implementation
**Use When:** Modifying Razorpay integration, credit system, subscription handling, or plan gating

---

## Purpose
Evolve the existing payment foundation safely without breaking current purchase flows.

## Existing Foundation (DO NOT BREAK)
```
generator-server/src/controllers/
  paymentController.ts    ← Razorpay order creation + webhook
  getPlans.ts             ← Plan definitions
  getUserDetails.ts       ← User credits lookup

These endpoints are live and in use. Any changes must be backward compatible.
```

## Credit System Architecture
```
profiles.credits_remaining    ← Current balance (denormalized for fast checks)
credit_transactions           ← Full ledger (source of truth for audit)

Transaction types:
  purchase           → Razorpay payment confirmed
  subscription_grant → Monthly plan renewal
  generation         → Image generated (-1 per generation)
  refund             → Generation failed (compensating)
  admin_grant        → Manual admin credit grant
```

## Credit Check Pattern [NON-NEGOTIABLE]
```typescript
// ALWAYS use SELECT FOR UPDATE for credit deduction
// See skill 06-generation-pipeline.md for full atomic pattern

// NEVER check credits and deduct in separate queries (race condition risk)
// ALWAYS record a credit_transaction for every credit change
// ALWAYS verify balanceAfter matches expected value before committing
```

## Razorpay Webhook Safety
```typescript
// Verify webhook signature before processing
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils'

function verifyRazorpayWebhook(req: Request): boolean {
  const signature = req.headers['x-razorpay-signature'] as string
  return validateWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  )
}

// Idempotency: check if payment already processed before crediting
const existing = await creditRepository.findByReference(paymentId)
if (existing) return res.status(200).json({ status: 'already_processed' })
```

## Plan Gating Pattern
```typescript
// services/credit.service.ts
async function checkGenerationAccess(profileId: string) {
  const profile = await profileRepository.findById(profileId)
  if (profile.creditsRemaining < 1) {
    throw new PaymentRequiredError('No credits remaining. Purchase more to continue.')
  }
}
```

## Backward Compatibility Rules
- Keep existing `/api/get-plans` endpoint shape
- Keep existing `/api/create-order` endpoint shape
- Keep existing credit field on user response
- New `credit_transactions` table is additive — does not break existing flows
- Migrate existing credit balance into transactions retroactively (migration-coordinator task)

## References
- AGENT.md §6 (backend conventions)
- `generator-server/src/controllers/paymentController.ts` (inspect before changing)
