// src/services/draft.service.ts
// Business logic for draft assets (studio workflow).

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
import sharp from "sharp";
import { logger } from "../utils/logger";

export interface GenerateResult {
  asset: draftRepo.DraftAsset;
  creditsRemaining: number;
}

/**
 * Generate an image from a prompt and save as a private draft asset.
 */
export async function generateDraft(
  clerkId: string,
  prompt: string
): Promise<GenerateResult> {
  // 1. Resolve user to ensure they exist in DB
  const user = await profileRepo.resolveOrProvisionUser(clerkId);

  // 2. Reserve credit atomically *before* expensive work
  const reserved = await profileRepo.reserveCredit(clerkId);
  if (!reserved) {
    throw new PaymentRequiredError(
      "You have no credits remaining. Purchase more to continue generating."
    );
  }

  try {
    // 3. Generate Title quickly
    const title = await generateTitleFromPrompt(prompt);

    // 4. Create pending record immediately
    const asset = await draftRepo.create({
      profileId: user.id,
      title,
      prompt,
      imageUrl: "",
    }, true); // true for isPending

    const creditsRemaining = Math.max(0, user.credits - 1);

    // 5. Fire background job for the expensive image generation
    (async () => {
      try {
        logger.info(`[Job Started] Generating image for asset ${asset.id}...`);
        const imageBuffer = await generateImageFromPrompt(prompt);
        
        // Optimize the image using Sharp
        const optimizedBuffer = await sharp(imageBuffer)
          .webp({ quality: 80 })
          .toBuffer();

        const imageUrl = await uploadImageToBucket(optimizedBuffer);
        
        await draftRepo.updateGenerationResult(asset.id, imageUrl);
        logger.info(`[Job Finished] Asset ${asset.id} completed successfully.`);
      } catch (error) {
        logger.error({ error }, "❌ Failed to process generated image:");
        await draftRepo.markFailed(asset.id);
        await profileRepo.refundCredit(clerkId);
      }
    })();

    // 6. Return immediately to the client
    return { asset, creditsRemaining };
  } catch (error) {
    // If the initial setup fails (e.g. title generation or DB insert), refund credit
    await profileRepo.refundCredit(clerkId);
    throw error;
  }
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
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  // Verify it exists and is owned by this user
  const asset = await draftRepo.findById(assetId);
  if (!asset) throw new NotFoundError("Draft asset not found");
  
  if (asset.owner_profile_id !== profile.id) {
    throw new ForbiddenError("You can only delete your own draft assets");
  }

  await draftRepo.deleteOwned(assetId, clerkId);
}

/**
 * Get a specific draft asset — verifies ownership.
 */
export async function getDraft(
  clerkId: string,
  assetId: string
) {
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  const asset = await draftRepo.findById(assetId);
  if (!asset) throw new NotFoundError("Draft asset not found");

  if (asset.owner_profile_id !== profile.id) {
    throw new ForbiddenError("You can only view your own draft assets");
  }

  return asset;
}
