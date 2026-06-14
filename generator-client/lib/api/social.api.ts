// src/lib/api/social.api.ts
import { createApiClient } from "./client";
import type { Comment, PaginatedComments, SocialMeta } from "@/types/social";

export type { Comment, PaginatedComments, SocialMeta } from "@/types/social";

export const socialApi = (getToken: () => Promise<string | null>) => {
  const client = createApiClient(getToken);
  
  return {
    // --- LIKES ---
    toggleLike: async (postId: string) => {
      const res = await client.post<{ data: { liked: boolean } }>(`/social/posts/${postId}/like`);
      return res.data;
    },
    getPostMeta: async (postId: string) => {
      const res = await client.get<{ data: SocialMeta }>(`/social/posts/${postId}/likes`);
      return res.data;
    },

    // --- FOLLOWS ---
    toggleFollow: async (targetUsername: string) => {
      const res = await client.post<{ data: { following: boolean } }>(`/social/users/${targetUsername}/follow`);
      return res.data;
    },
    getProfileMeta: async (username: string) => {
      const res = await client.get<{ data: SocialMeta }>(`/social/users/${username}/followers`);
      return res.data;
    },

    // --- COMMENTS ---
    addComment: async (postId: string, body: string, parentCommentId?: string) => {
      const res = await client.post<{ data: Comment }>(`/social/posts/${postId}/comments`, { body, parentCommentId });
      return res.data;
    },
    listComments: async (postId: string, cursor?: string, limit = 20) => {
      const url = cursor
        ? `/social/posts/${postId}/comments?cursor=${encodeURIComponent(cursor)}&limit=${limit}`
        : `/social/posts/${postId}/comments?limit=${limit}`;
      const res = await client.get<PaginatedComments>(url);
      return res;
    },
    deleteComment: async (commentId: string) => {
      const res = await client.delete<{ data: { success: boolean } }>(`/social/comments/${commentId}`);
      return res.data;
    },
    reportComment: async (commentId: string, reason: string) => {
      const res = await client.post<{ data: { success: boolean } }>(`/social/comments/${commentId}/report`, { reason });
      return res.data;
    }
  };
};
