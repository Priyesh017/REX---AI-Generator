import type { PaginationMeta } from "./pagination";
import type { PostAuthor } from "./post";

export interface SocialMeta {
  likes?: number;
  hasLiked?: boolean;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_profile_id: string;
  body: string;
  created_at: string;
  author?: PostAuthor;
}

export interface PaginatedComments {
  data: Comment[];
  meta: PaginationMeta;
}
