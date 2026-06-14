// src/repositories/notification.repository.ts
import { supabase } from "../config/supabase";
import { encodeCursor, decodeCursor } from "../utils/cursor";

export interface NotificationRecord {
  id: string;
  recipient_profile_id: string;
  sender_profile_id: string | null;
  type: "like" | "comment" | "follow" | "system";
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  post?: {
    caption: string | null;
    generated_asset_id: string;
    asset?: {
      image_url: string;
    } | null;
  };
}

export async function createNotification(payload: {
  recipientProfileId: string;
  senderProfileId: string | null;
  type: "like" | "comment" | "follow" | "system";
  postId?: string;
  commentId?: string;
}): Promise<NotificationRecord> {
  // Prevent duplicate follows, likes, etc. notifications if desired
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        recipient_profile_id: payload.recipientProfileId,
        sender_profile_id: payload.senderProfileId,
        type: payload.type,
        post_id: payload.postId || null,
        comment_id: payload.commentId || null,
        is_read: false,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`DB error in createNotification: ${error.message}`);
  }

  return data as NotificationRecord;
}

export async function listNotifications(
  recipientProfileId: string,
  limit = 20,
  cursor?: string
) {
  let query = supabase
    .from("notifications")
    .select(`
      *,
      sender:profiles!sender_profile_id (username, display_name, avatar_url),
      post:posts!post_id (
        caption, 
        generated_asset_id,
        asset:generated_assets!generated_asset_id (image_url)
      )
    `)
    .eq("recipient_profile_id", recipientProfileId);

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.or(`created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`);
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (error) {
    throw new Error(`DB error in listNotifications: ${error.message}`);
  }

  const rawNotifications = data || [];
  const hasMore = rawNotifications.length > limit;
  const slicedNotifications = hasMore ? rawNotifications.slice(0, limit) : rawNotifications;

  let nextCursor: string | null = null;
  if (hasMore && slicedNotifications.length > 0) {
    const lastItem = slicedNotifications[slicedNotifications.length - 1];
    nextCursor = encodeCursor({
      createdAt: lastItem.created_at,
      id: lastItem.id,
    });
  }

  return {
    notifications: slicedNotifications as NotificationRecord[],
    pagination: {
      nextCursor,
      hasMore,
    },
  };
}

export async function markAsRead(
  recipientProfileId: string,
  notificationIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_profile_id", recipientProfileId)
    .in("id", notificationIds);

  if (error) {
    throw new Error(`DB error in markAsRead: ${error.message}`);
  }
}

export async function markAllAsRead(recipientProfileId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_profile_id", recipientProfileId)
    .eq("is_read", false);

  if (error) {
    throw new Error(`DB error in markAllAsRead: ${error.message}`);
  }
}
