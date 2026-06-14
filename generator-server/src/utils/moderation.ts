// src/utils/moderation.ts
/**
 * Shared moderation words and checker.
 * Uses word-boundary regex to prevent false positives.
 */
export const restrictedWords = ["nsfw", "gore", "violence", "hate", "spam"];

export function containsRestrictedContent(text: string): boolean {
  const lowercaseText = text.toLowerCase();
  
  return restrictedWords.some((word) => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedWord}\\b`, "i");
    return regex.test(lowercaseText);
  });
}
