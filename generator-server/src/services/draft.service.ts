// src/services/draft.service.ts
// Business logic for draft assets (studio workflow).
// Coordinates profile check + generation + storage + draft persistence.
// This service owns the "generate → draft" lifecycle.

import * as profileRepo from "../repositories/profile.repository";
import * as draftRepo from "../repositories/draft.repository";
import { generateImageFromPrompt } from "../config/huggingface";
import { uploadImageToBucket } from "../lib/upload";
import { generateTitleFromPrompt } from "../lib/titleGenerator";
import {
  PaymentRequiredError,
  NotFoundError,
  ForbiddenError,
} from "../lib/errors";

export interface GenerateResult {
  asset: draftRepo.DraftAsset;
  creditsRemaining: number;
}

/**
 * Generate an image from a prompt and save as a private draft asset.
 * Handles credit check → AI call → upload → persist → credit deduction.
 *
 * Credit deduction is best-effort compensating: deducted after successful
 * generation to prevent charging on failures. Race-safe via conditional UPDATE.
 */
export async function generateDraft(
  clerkId: string,
  prompt: string
): Promise<GenerateResult> {
  // 1. Ensure user exists and has credits
  const user = await profileRepo.resolveOrProvisionUser(clerkId);

  if (user.credits < 1) {
    throw new PaymentRequiredError(
      "You have no credits remaining. Purchase more to continue generating."
    );
  }

  // 2. Generate image via AI provider
  const imageBuffer = await generateImageFromPrompt(prompt);

  // 3. Upload to Supabase Storage
  const imageUrl = await uploadImageToBucket(imageBuffer);

  // 4. Generate title
  const title = await generateTitleFromPrompt(prompt);

  // 5. Persist draft asset record
  const asset = await draftRepo.create({
    clerkId,
    title,
    prompt,
    imageUrl,
  });

  // 6. Deduct credit (after successful generation — compensating pattern)
  const deducted = await profileRepo.decrementCredit(clerkId, user.credits);
  const creditsRemaining = deducted ? user.credits - 1 : user.credits;

  return { asset, creditsRemaining };
}

/**
 * List a user's draft assets (studio history).
 */
export async function listDrafts(
  clerkId: string,
  page: number,
  limit: number
) {
  return draftRepo.listByClerkId(clerkId, page, limit);
}

/**
 * Delete a draft asset — verifies ownership.
 */
export async function deleteDraft(
  clerkId: string,
  assetId: string
): Promise<void> {
  // Verify it exists and is owned by this user
  const asset = await draftRepo.findById(assetId);
  if (!asset) throw new NotFoundError("Draft asset not found");
  if (asset.user_id !== clerkId) {
    throw new ForbiddenError("You can only delete your own draft assets");
  }

  await draftRepo.deleteOwned(assetId, clerkId);
}
