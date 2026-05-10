// lib/api/studio.api.ts
// API functions for the studio/generation domain.

import { createApiClient } from "./client";

export interface DraftAsset {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  generation_status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface GenerateResult {
  asset: DraftAsset;
  creditsRemaining: number;
}

export interface DraftListMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export function studioApi(getToken: () => Promise<string | null>) {
  const client = createApiClient(getToken);

  return {
    /** POST /studio/generate — generate image from prompt */
    generate: (prompt: string) =>
      client
        .post<{ data: GenerateResult }>("/studio/generate", { prompt })
        .then((r) => r.data),

    /** GET /studio/drafts — list current user's draft assets */
    listDrafts: (page = 1, limit = 12) =>
      client
        .get<{ data: DraftAsset[]; meta: DraftListMeta }>(
          `/studio/drafts?page=${page}&limit=${limit}`
        )
        .then((r) => ({ assets: r.data, meta: r.meta })),

    /** GET /studio/drafts/:id — get a specific draft asset */
    getDraft: (id: string) =>
      client
        .get<{ data: { asset: DraftAsset } }>(`/studio/drafts/${id}`)
        .then((r) => r.data),

    /** DELETE /studio/drafts/:id */
    deleteDraft: (id: string) =>
      client
        .delete<{ data: { deleted: boolean } }>(`/studio/drafts/${id}`)
        .then((r) => r.data),
  };
}
