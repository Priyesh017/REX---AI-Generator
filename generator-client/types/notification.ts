import type { PaginationMeta } from "./pagination";

export interface NotificationSender {
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface NotificationPost {
  caption: string | null;
  generated_asset_id: string;
  asset?: {
    image_url: string;
  } | null;
}

export interface Notification {
  id: string;
  recipient_profile_id: string;
  sender_profile_id: string | null;
  type: "like" | "comment" | "follow" | "system";
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  sender?: NotificationSender;
  post?: NotificationPost;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: {
    pagination: PaginationMeta;
  };
}
