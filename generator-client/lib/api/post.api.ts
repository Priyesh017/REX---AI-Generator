import { createApiClient } from "./client";
import type { ListPostsResponse, Post } from "@/types/post";

export type { ListPostsResponse, Post } from "@/types/post";

export const postApi = (getToken: () => Promise<string | null>) => {
  const client = createApiClient(getToken);

  return {
    /** List public posts for the feed or a specific user */
    list: async (params: { username?: string; cursor?: string; limit?: number }): Promise<ListPostsResponse> => {
      const searchParams = new URLSearchParams();
      if (params.username) searchParams.append("username", params.username);
      if (params.cursor) searchParams.append("cursor", params.cursor);
      if (params.limit) searchParams.append("limit", params.limit.toString());

      return client.get<{ data: Post[]; meta: ListPostsResponse["meta"] }>(`/posts?${searchParams.toString()}`)
        .then(r => ({
          posts: r.data,
          meta: r.meta
        }));
    },

    /** Get a single post by ID */
    get: async (id: string) => {
      return client.get<{ data: { post: Post } }>(`/posts/${id}`)
        .then(r => r.data);
    },

    /** Create a public post from a private draft */
    publish: async (draftId: string, data: { title?: string; caption?: string }) => {
      return client.post<{ data: { post: Post } }>("/posts", {
        draft_id: draftId,
        title: data.title,
        caption: data.caption,
      }).then(r => r.data);
    },

    /** Delete a post */
    delete: async (id: string) => {
      return client.delete(`/posts/${id}`);
    },

    /** Report a post */
    report: async (id: string, reason: string) => {
      return client.post(`/posts/${id}/report`, { reason });
    },
  };
};
