import type { PaginationMeta } from "./pagination";

export type GenerationStatus = "pending" | "completed" | "failed";

export interface DraftAsset {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  generation_status: GenerationStatus;
  created_at: string;
}

export interface GenerateResult {
  asset: DraftAsset;
  creditsRemaining: number;
}

export interface DraftListMeta {
  pagination: PaginationMeta;
}
