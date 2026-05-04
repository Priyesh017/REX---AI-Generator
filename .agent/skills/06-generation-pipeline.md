# Skill: Generation Pipeline (`06-generation-pipeline`)

**Type:** Implementation
**Use When:** Modifying image generation flow, credit deduction, draft creation, or storage upload

---

## Purpose
Manage the generation lifecycle correctly: prompt → AI call → storage → draft (generated_image, private).
The pipeline endpoint produces a draft — it never creates a post.

## Inputs Expected
- Change description
- Current generateController.ts state (always inspect first)

## Outputs Required
- Updated controller/service/repository for generation domain
- Credit transaction record
- generated_image record with status=completed|failed

## Generation Lifecycle [NON-NEGOTIABLE]
```
User submits prompt
  → Credit check (SELECT FOR UPDATE)
  → Credit deduct (UPDATE + INSERT credit_transaction)
  → AI call (Hugging Face)
  → Upload to private Supabase Storage
  → INSERT generated_images (status=completed, post_id=NULL)
  → Return imageId + creditsRemaining

On AI failure:
  → INSERT generated_images (status=failed)
  → ROLLBACK credit deduction (compensating transaction)
  → INSERT credit_transaction (type='refund')
  → Return error to user
```

## Credit Atomicity Pattern [NON-NEGOTIABLE]
```typescript
// services/generation.service.ts
async function generateImage(profileId: string, params: GenerateParams) {
  // Step 1: Atomic credit check + deduct
  const profile = await db.transaction(async (tx) => {
    const [p] = await tx.select().from(profiles)
      .where(eq(profiles.id, profileId))
      .for('update')  // row lock

    if (p.creditsRemaining < 1) throw new PaymentRequiredError('Insufficient credits')

    await tx.update(profiles)
      .set({ creditsRemaining: p.creditsRemaining - 1 })
      .where(eq(profiles.id, profileId))

    await tx.insert(creditTransactions).values({
      profileId, amount: -1, type: 'generation',
      balanceAfter: p.creditsRemaining - 1,
    })
    return p
  })

  // Step 2: AI call (outside transaction — external)
  let imageBuffer: Buffer
  try {
    imageBuffer = await huggingFaceService.generate(params)
  } catch (err) {
    // Compensating: refund credit
    await refundCredit(profileId)
    await insertFailedImage(profileId, params, err.message)
    throw new GenerationFailedError('AI generation failed')
  }

  // Step 3: Upload + record
  const storagePath = await storageService.uploadDraft(profileId, imageBuffer)
  const image = await generationRepository.create({ profileId, storagePath, status: 'completed', ...params })
  return image
}
```

## Draft vs Published Rule [NON-NEGOTIABLE]
```
generated_images.post_id = NULL   → DRAFT (private, visible only to owner)
generated_images.post_id = UUID   → PUBLISHED (backs a post, public if post is public)

The generation pipeline NEVER sets post_id.
Only the publishing workflow sets post_id.
```

## Storage Path Convention
```
Private bucket: generated-images/{profile_id}/{image_id}/original.webp
                generated-images/{profile_id}/{image_id}/thumb.webp
Access: Short-lived signed URL (15 min) for owner viewing drafts
```

## References
- AGENT.md §5.1 (two-entity rule), §5.3 (history rule)
- `.agent/skills/07-post-publishing-workflow.md`
