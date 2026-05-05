"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { postApi, type Post } from "@/lib/api/post.api";
import { ApiRequestError } from "@/lib/api/client";

export default function PostDetailPage({ postId }: { postId: string }) {
  const { getToken } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const api = postApi(getToken);
        const data = await api.get(postId);
        setPost(data.post);
      } catch (err) {
        setError(
          err instanceof ApiRequestError ? err.message : "Post not found",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, getToken]);

  const handleCopyPrompt = () => {
    if (!post?.prompt) return;
    navigator.clipboard.writeText(post.prompt);
    toast.success("Prompt copied to clipboard");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
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
          {/* Left: Image Canvas */}
          <div className="flex-1">
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

              {/* Creator Card */}
              <Link
                href={`/u/${post.creator?.username}`}
                className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl hover:border-zinc-700 transition group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-zinc-700">
                  <Image
                    src={
                      post.creator?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.creator?.username}`
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
                    @{post.creator?.username}
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
              className="flex gap-3"
            >
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
