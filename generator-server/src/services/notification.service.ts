// src/services/notification.service.ts
import * as notificationRepo from "../repositories/notification.repository";

export async function getNotifications(profileId: string, limit = 20, cursor?: string) {
  return notificationRepo.listNotifications(profileId, limit, cursor);
}

export async function markRead(profileId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return;
  await notificationRepo.markAsRead(profileId, notificationIds);
  return { success: true };
}

export async function markAllRead(profileId: string) {
  await notificationRepo.markAllAsRead(profileId);
  return { success: true };
}

export async function createNotification(payload: {
  recipientProfileId: string;
  senderProfileId: string | null;
  type: "like" | "comment" | "follow" | "system";
  postId?: string;
  commentId?: string;
}) {
  // Prevent sending notifications to oneself
  if (payload.senderProfileId === payload.recipientProfileId) {
    return null;
  }
  return notificationRepo.createNotification(payload);
}
