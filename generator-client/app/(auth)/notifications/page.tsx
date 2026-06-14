"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  Loader2, 
  Calendar,
  Sparkles,
  Inbox
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import AppShell from "@/components/shared/AppShell";
import { notificationApi } from "@/lib/api/notification.api";
import type { PaginatedNotifications } from "@/types/notification";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const { getToken, userId, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const api = notificationApi(getToken);

  // Keyset infinite query for notifications
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      return api.list({ cursor: pageParam as string | undefined, limit: 15 });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.pagination.nextCursor ?? undefined;
    },
    enabled: !!userId,
  });

  const notifications = data?.pages.flatMap(page => page.data) || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllRead(),
    onMutate: async () => {
      // Optimistically mark all read locally
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousData = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old: InfiniteData<PaginatedNotifications> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((n) => ({ ...n, is_read: true }))
          }))
        };
      });
      return { previousData };
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications'], context.previousData);
      }
      toast.error("Failed to mark all as read");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark individual as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markRead([id]),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousData = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old: InfiniteData<PaginatedNotifications> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((n) => n.id === id ? { ...n, is_read: true } : n)
          }))
        };
      });
      return { previousData };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleMarkAllRead = () => {
    if (notifications.length === 0) return;
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
        </div>
      </AppShell>
    );
  }

  if (!userId) {
    return (
      <AppShell>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-black">
          <Bell className="w-16 h-16 text-zinc-700 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Sign in to view notifications</h2>
          <p className="text-sm text-zinc-500 max-w-xs">
            Join REX to follow creators, get updates on your posts, and manage your activity feed.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-black pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <Bell className="w-6 h-6 text-indigo-400" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 border-2 border-black rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
                <p className="text-xs text-zinc-500">Activity on your profile and creations</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markAllReadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition active:scale-95"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-4 border border-zinc-800 bg-zinc-900/10 rounded-3xl text-center"
            >
              <Inbox className="w-12 h-12 text-zinc-700 mb-4" />
              <h3 className="text-base font-bold text-white">All caught up!</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                When people like, comment, follow you, or when system changes occur, they will show up here.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {notifications.map((notification) => {
                  const isRead = notification.is_read;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleNotificationClick(notification.id, isRead)}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all relative group cursor-pointer ${
                        isRead 
                          ? "bg-zinc-900/20 border-zinc-900 hover:border-zinc-800" 
                          : "bg-indigo-500/[0.03] border-indigo-500/20 hover:border-indigo-500/30 shadow-indigo-950/20 shadow-sm"
                      }`}
                    >
                      {/* Active indicator dot */}
                      {!isRead && (
                        <div className="absolute top-1/2 left-3 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      )}

                      {/* Icon type column */}
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
                        !isRead ? "pl-2.5" : "pl-0"
                      }`}>
                        {notification.type === "like" && (
                          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
                            <Heart className="w-4 h-4 fill-current" />
                          </div>
                        )}
                        {notification.type === "comment" && (
                          <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        )}
                        {notification.type === "follow" && (
                          <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-lg">
                            <UserPlus className="w-4 h-4" />
                          </div>
                        )}
                        {notification.type === "system" && (
                          <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-start gap-1 flex-wrap text-sm text-zinc-300">
                          {notification.sender && (
                            <Link 
                              href={`/u/${notification.sender.username}`}
                              className="font-bold text-white hover:text-indigo-400 transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              @{notification.sender.username}
                            </Link>
                          )}
                          
                          {notification.type === "like" && <span>liked your creation.</span>}
                          {notification.type === "comment" && <span>commented on your post.</span>}
                          {notification.type === "follow" && <span>started following you.</span>}
                          {notification.type === "system" && <span>System update details.</span>}
                        </div>

                        {/* Sub-body text e.g. comment text or system message */}
                        {notification.type === "comment" && notification.post?.caption && (
                          <p className="mt-1.5 text-xs text-zinc-500 italic line-clamp-1 border-l-2 border-zinc-800 pl-2">
                            {notification.post.caption}
                          </p>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-600 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Right-aligned media preview for post associations */}
                      {notification.post && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 shrink-0 self-center">
                          <Link 
                            href={`/posts/${notification.post_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block w-full h-full relative group"
                          >
                            <Image
                              src={notification.post.asset?.image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=120"}
                              alt="Creation preview"
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-110 transition duration-300"
                              onError={(e) => {
                                // Fallback image if needed
                                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=120";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider">View</span>
                            </div>
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Load More Button */}
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white transition mt-6 disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load older notifications"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
