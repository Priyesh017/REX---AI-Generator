// src/utils/title-generator.ts
export const generateTitleFromPrompt = (prompt: string): string => {
  const cleaned = prompt
    .replace(/[^a-zA-Z0-9 ]/g, "") // remove special characters
    .split(" ")
    .filter((word) => word.length > 2) // skip short words
    .slice(0, 5) // use first 5 significant words
    .map((word) => word[0].toUpperCase() + word.slice(1)) // capitalize
    .join(" ");

  return cleaned || "Generated Image";
};
