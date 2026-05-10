// components/explore/ExploreFeedPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, type Variants } from "framer-motion";
import { Compass, Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { postApi, type Post } from "@/lib/api/post.api";
import { ApiRequestError } from "@/lib/api/client";
import Navbar from "../navbar";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export default function ExploreFeedPage({ initialPosts = [] }: { initialPosts?: Post[] }) {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have server-rendered posts, we don't strictly need to refetch immediately,
    // but we can background refresh or just rely on SSR. For now, if we have them, we skip.
    if (initialPosts.length > 0) return;

    const fetchFeed = async () => {
      setLoading(true);
      try {
        const api = postApi(getToken);
        // Fetch all public posts for the feed
        const data = await api.list({ limit: 48 });
        setPosts(data.posts);
      } catch (err) {
        setError(
          err instanceof ApiRequestError ? err.message : "Failed to load feed",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [getToken, initialPosts]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-zinc-900 rounded-full border border-zinc-800 mb-6">
            <Compass className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Explore
          </h1>
          <p className="text-zinc-400 max-w-lg">
            Discover the latest and greatest AI creations from the REX
            community.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          </div>
        ) : error ? (
          <div className="py-24 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-24 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
            <ImageOff className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-sm font-medium text-zinc-600">
              The feed is currently empty.
            </p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                custom={i % 8}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "100px" }}
                className="break-inside-avoid"
              >
                <Link
                  href={`/posts/${post.id}`}
                  className="block group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all shadow-lg hover:shadow-xl"
                >
                  {/* Using standard <img> since masonry layout with next/image can be tricky, or object-cover */}
                  <Image
                    src={post.image_url}
                    alt={post.title || "AI Art"}
                    width={500}
                    height={500}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-white font-bold text-sm line-clamp-1">
                      {post.title || "Untitled"}
                    </p>
                    {post.author && (
                      <p className="text-zinc-400 text-xs font-medium mt-1">
                        by @{post.author.username}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
