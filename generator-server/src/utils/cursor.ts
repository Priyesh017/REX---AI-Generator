// src/utils/cursor.ts
export interface KeysetCursor {
  createdAt: string;
  id: string;
}

/**
 * Encodes a keyset cursor object into a Base64 string.
 */
export function encodeCursor(cursorObj: KeysetCursor): string {
  return Buffer.from(JSON.stringify(cursorObj)).toString("base64");
}

/**
 * Decodes a Base64 cursor string into a keyset cursor object.
 */
export function decodeCursor(cursorStr: string): KeysetCursor | null {
  try {
    const decoded = Buffer.from(cursorStr, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.createdAt === "string" && typeof parsed.id === "string") {
      return parsed as KeysetCursor;
    }
    return null;
  } catch (err) {
    return null;
  }
}
