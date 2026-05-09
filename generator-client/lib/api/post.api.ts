import { createApiClient } from "./client";

export interface Post {
  id: string;
  author_profile_id: string;
  image_url: string;
  prompt: string;
  title: string | null;
  caption: string | null;
  created_at: string;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface ListPostsResponse {
  posts: Post[];
  meta: {
    pagination: {
      total: number;
      page: number;
      limit: number;
      hasNext: boolean;
    };
  };
}

export const postApi = (getToken: () => Promise<string | null>) => {
  const client = createApiClient(getToken);

  return {
    /** List public posts for the feed or a specific user */
    list: async (params: { username?: string; page?: number; limit?: number }): Promise<ListPostsResponse> => {
      const searchParams = new URLSearchParams();
      if (params.username) searchParams.set("username", params.username);
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());

      return client.get<{ data: Post[]; meta: ListPostsResponse["meta"] }>(`/posts?${searchParams.toString()}`)
        .then(r => ({
          posts: r.data,
          meta: r.meta
        }));
    },

    /** Get a single post by ID */
    get: async (id: string) => {
      return client.get<{ post: Post }>(`/posts/${id}`);
    },

    /** Create a public post from a private draft */
    publish: async (draftId: string, data: { title?: string; caption?: string }) => {
      return client.post<{ post: Post }>("/posts", {
        draft_id: draftId,
        title: data.title,
        caption: data.caption,
      });
    },

    /** Delete a post */
    delete: async (id: string) => {
      return client.delete(`/posts/${id}`);
    },
  };
};
