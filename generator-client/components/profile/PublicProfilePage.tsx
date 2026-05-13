"use client";

import { useAuth } from "@clerk/nextjs";
import { motion, type Variants } from "framer-motion";
import { 
  Grid3X3, 
  ImageOff, 
  Loader2, 
  Sparkles,
  Share2,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { postApi, type ListPostsResponse, type Post } from "@/lib/api/post.api";
import { ApiRequestError } from "@/lib/api/client";
import { socialApi, type SocialMeta } from "@/lib/api/social.api";
import toast from "react-hot-toast";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PublicProfilePageProps {
  username: string;
}

interface ProfileQueryData {
  posts: Post[];
  meta: ListPostsResponse["meta"];
  socialStats: SocialMeta;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function PublicProfilePage({ username }: PublicProfilePageProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const pApi = postApi(getToken);
      const sApi = socialApi(getToken);
      
      const [postData, socialData] = await Promise.all([
        pApi.list({ username, limit: 24 }),
        sApi.getProfileMeta(username)
      ]);
      
      return { 
        posts: postData.posts, 
        meta: postData.meta,
        socialStats: socialData 
      };
    }
  });

  const posts = data?.posts || [];
  const socialStats = data?.socialStats || { followers: 0, following: 0, isFollowing: false };

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const api = socialApi(getToken);
      return api.toggleFollow(username);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['profile', username] });
      const previousData = queryClient.getQueryData<ProfileQueryData>(['profile', username]);
      
      queryClient.setQueryData(['profile', username], (old: ProfileQueryData | undefined) => {
        if (!old) return old;
        const isFollowing = !old.socialStats.isFollowing;
        return {
          ...old,
          socialStats: {
            ...old.socialStats,
            isFollowing,
            followers: (old.socialStats.followers ?? 0) + (isFollowing ? 1 : -1)
          }
        };
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['profile', username], context.previousData);
      }
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to follow user");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    }
  });

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied!");
  };

  const handleToggleFollow = () => {
    toggleFollowMutation.mutate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ImageOff className="w-12 h-12 text-zinc-700" />
        <h2 className="text-xl font-bold text-white">Profile not found</h2>
        <p className="text-sm text-zinc-500 max-w-xs">The creator @{username} doesn&apos;t exist or is currently unavailable.</p>
        <Link href="/" className="text-indigo-400 hover:underline text-sm font-medium">Explore Gallery</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-16 border-b border-zinc-800/50 pb-12"
        >
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-2 border-zinc-800 relative bg-zinc-900 shadow-2xl shrink-0">
            <Image
              src={posts[0]?.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
              alt={username}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
              @{username}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Creator</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Users className="w-3.5 h-3.5" />
                <span>{socialStats.followers} Followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>{data?.meta?.pagination?.total ?? posts.length} Posts</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 md:mt-0">
            <button
              onClick={handleShareProfile}
              className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleToggleFollow}
              disabled={toggleFollowMutation.isPending}
              className={`px-8 py-3 rounded-2xl font-bold transition shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${socialStats.isFollowing ? 'bg-zinc-800 text-white hover:bg-zinc-700 shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'}`}
            >
              {toggleFollowMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : socialStats.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </motion.div>

        {/* Gallery Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-8">
            <Grid3X3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Public Gallery</h2>
          </div>

          {posts.length === 0 ? (
            <div className="py-24 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
              <ImageOff className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
              <p className="text-sm font-medium text-zinc-600">This creator hasn&apos;t published any posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Link href={`/posts/${post.id}`} className="block group">
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-zinc-600 shadow-lg">
                      <Image
                        src={post.image_url}
                        alt={post.title || "AI Art"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                        <p className="text-white font-bold text-sm truncate">{post.title || "Untitled"}</p>
                        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest mt-1">View Post</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
