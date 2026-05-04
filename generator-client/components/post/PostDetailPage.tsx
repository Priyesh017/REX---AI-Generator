"use client";

// components/post/PostDetailPage.tsx
// Post detail view — scaffold for Phase 2 post publishing.
// Structure is production-ready: image, creator info, engagement actions (disabled).

import { ImageOff } from "lucide-react";

interface Props {
  postId: string;
}

export default function PostDetailPage({ postId }: Props) {
  // Phase 2: replace with useQuery('/api/posts/:id')
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="max-w-2xl w-full flex flex-col items-center gap-6 text-zinc-500">
        <ImageOff className="w-12 h-12" />
        <div className="text-center">
          <h1 className="text-lg font-semibold text-zinc-300">Post not found</h1>
          <p className="text-sm mt-2">
            Post publishing is coming soon. This page will display AI-generated
            artwork with prompt details, creator info, and social interactions.
          </p>
          <p className="text-xs text-zinc-700 mt-2">Post ID: {postId}</p>
        </div>
      </div>
    </div>
  );
}
