import { createApiClient } from "./client";
import type { PaginatedNotifications } from "@/types/notification";

export const notificationApi = (getToken: () => Promise<string | null>) => {
  const client = createApiClient(getToken);

  return {
    /** List user notifications with keyset cursor pagination */
    list: async (params: { cursor?: string; limit?: number }): Promise<PaginatedNotifications> => {
      const searchParams = new URLSearchParams();
      if (params.cursor) searchParams.append("cursor", params.cursor);
      if (params.limit) searchParams.append("limit", params.limit.toString());

      return client.get<PaginatedNotifications>(`/notifications?${searchParams.toString()}`);
    },

    /** Mark specific notifications as read */
    markRead: async (notificationIds: string[]) => {
      return client.post<{ data: { success: boolean } }>("/notifications/read", { notificationIds })
        .then(r => r.data);
    },

    /** Mark all user notifications as read */
    markAllRead: async () => {
      return client.post<{ data: { success: boolean } }>("/notifications/read-all")
        .then(r => r.data);
    },
  };
};
