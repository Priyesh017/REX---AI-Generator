"use client";

import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Calendar,
  User,
  Copy,
  Download,
  Share2,
  Sparkles,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Heart,
  MessageCircle,
  Send
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { postApi, type Post } from "@/lib/api/post.api";
import { socialApi, type SocialMeta, type Comment } from "@/lib/api/social.api";
import { ApiRequestError } from "@/lib/api/client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});
type CommentFormData = z.infer<typeof commentSchema>;

export default function PostDetailPage({ 
  postId, 
  initialPost = null, 
  initialSocialStats = null, 
  initialComments = [] 
}: { 
  postId: string;
  initialPost?: Post | null;
  initialSocialStats?: SocialMeta | null;
  initialComments?: Comment[];
}) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const pApi = postApi(getToken);
      const sApi = socialApi(getToken);
      const [postData, metaData, commentsData] = await Promise.all([
        pApi.get(postId),
        sApi.getPostMeta(postId),
        sApi.listComments(postId)
      ]);
      return { 
        post: postData.post, 
        socialStats: metaData, 
        comments: commentsData.data || [] 
      };
    },
    initialData: initialPost && initialSocialStats ? {
      post: initialPost,
      socialStats: initialSocialStats,
      comments: initialComments
    } : undefined,
  });

  const post = data?.post;
  const socialStats = data?.socialStats || { likes: 0, hasLiked: false };
  const comments = data?.comments || [];

  const toggleLikeMutation = useMutation({
    mutationFn: async () => socialApi(getToken).toggleLike(postId),
    onMutate: async () => {
      if (!userId) {
        toast.error("Please sign in to like posts");
        throw new Error("Unauthorized");
      }
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previousData = queryClient.getQueryData<{post: Post, socialStats: SocialMeta, comments: Comment[]}>(['post', postId]);
      queryClient.setQueryData(['post', postId], (old: {post: Post, socialStats: SocialMeta, comments: Comment[]} | undefined) => {
        if (!old) return old;
        const hasLiked = !old.socialStats.hasLiked;
        return {
          ...old,
          socialStats: {
            ...old.socialStats,
            hasLiked,
            likes: Math.max(0, (old.socialStats.likes ?? 0) + (hasLiked ? 1 : -1))
          }
        };
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['post', postId], context.previousData);
      }
      if (err.message !== "Unauthorized") toast.error("Failed to toggle like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (formData: CommentFormData) => {
      const api = socialApi(getToken);
      return api.addComment(postId, formData.body.trim());
    },
    onSuccess: () => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to add comment");
    }
  });

  const { register, handleSubmit, reset } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  });

  const onSubmitComment = (data: CommentFormData) => {
    if (!userId) {
      toast.error("Please sign in to comment");
      return;
    }
    addCommentMutation.mutate(data);
  };

  const handleToggleLike = () => {
    toggleLikeMutation.mutate();
  };

  const handleCopyPrompt = () => {
    if (post?.prompt) {
      navigator.clipboard.writeText(post.prompt);
      toast.success("Prompt copied!");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-xl font-bold text-white">Post not found</h2>
        <p className="text-sm text-zinc-500">
          This post may have been deleted or is private.
        </p>
        <Link href="/" className="text-indigo-400 hover:underline text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Feed</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Image Canvas & Comments */}
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-square rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/50"
            >
              <Image
                src={post.image_url}
                alt={post.title || "AI Art"}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-400" />
                Comments ({comments.length})
              </h3>

              <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative border border-zinc-800 shrink-0">
                        <Image
                          src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username}`}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Link href={`/u/${comment.author?.username}`} className="font-bold text-white text-sm hover:text-indigo-400 transition">
                            @{comment.author?.username}
                          </Link>
                          <span className="text-xs text-zinc-600">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">{comment.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleSubmit(onSubmitComment)} className="relative">
                <input
                  type="text"
                  {...register("body")}
                  placeholder={userId ? "Add a comment..." : "Sign in to comment"}
                  disabled={!userId || addCommentMutation.isPending}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-5 pr-14 text-white text-sm focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={addCommentMutation.isPending || !userId}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Right: Info Panels */}
          <div className="w-full lg:w-[400px] space-y-8">
            {/* Header / Meta */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                {post.title || "Untitled Creation"}
              </h1>

              <Link
                href={`/u/${post.author?.username}`}
                className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl hover:border-zinc-700 transition group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-zinc-700">
                  <Image
                    src={
                      post.author?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username}`
                    }
                    alt="Creator"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    Creator
                  </p>
                  <p className="text-sm text-white font-bold group-hover:text-indigo-400 transition">
                    @{post.author?.username}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-white transition mr-2" />
              </Link>
            </motion.div>

            {/* Prompt Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="w-12 h-12 text-indigo-500/10 rotate-12" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Generation Prompt
                  </span>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition"
                  title="Copy prompt"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed italic">
                &ldquo;{post.prompt}&rdquo;
              </p>
            </motion.div>

            {/* Actions / Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-3"
            >
              <button
                onClick={handleToggleLike}
                disabled={toggleLikeMutation.isPending}
                className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition active:scale-95 disabled:opacity-70 ${socialStats.hasLiked ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
              >
                <Heart className={`w-5 h-5 ${socialStats.hasLiked ? 'fill-current' : ''}`} />
                {socialStats.likes} {socialStats.likes === 1 ? 'Like' : 'Likes'}
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => window.open(post.image_url, "_blank")}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-zinc-900 font-bold py-3 px-4 rounded-xl hover:bg-zinc-100 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </motion.div>

            {/* Additional Meta */}
            <div className="pt-6 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Published on {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>Private Metadata Hidden</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
