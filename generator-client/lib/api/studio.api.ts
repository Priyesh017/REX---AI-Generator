// lib/api/studio.api.ts
// API functions for the studio/generation domain.

import { createApiClient } from "./client";

export interface DraftAsset {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
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
    /** POST /api/studio/generate — generate image from prompt */
    generate: (prompt: string) =>
      client
        .post<{ data: GenerateResult }>("/api/studio/generate", { prompt })
        .then((r) => r.data),

    /** GET /api/studio/drafts — list current user's draft assets */
    listDrafts: (page = 1, limit = 12) =>
      client
        .get<{ data: DraftAsset[]; meta: DraftListMeta }>(
          `/api/studio/drafts?page=${page}&limit=${limit}`
        )
        .then((r) => ({ assets: r.data, meta: r.meta })),

    /** DELETE /api/studio/drafts/:id */
    deleteDraft: (id: string) =>
      client
        .delete<{ data: { deleted: boolean } }>(`/api/studio/drafts/${id}`)
        .then((r) => r.data),
  };
}
