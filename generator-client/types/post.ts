import type { PaginationMeta } from "./pagination";

export interface PostAuthor {
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface Post {
  id: string;
  author_profile_id: string;
  image_url: string;
  prompt: string;
  title: string | null;
  caption: string | null;
  created_at: string;
  author?: PostAuthor;
}

export interface ListPostsResponse {
  posts: Post[];
  meta: {
    pagination: PaginationMeta;
  };
}
