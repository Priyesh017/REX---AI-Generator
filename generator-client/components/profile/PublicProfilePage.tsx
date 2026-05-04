"use client";

// components/profile/PublicProfilePage.tsx
// Public creator profile — shows username, bio placeholder, and draft gallery.
// This is the social-facing profile, not the account settings page.
// Phase 2: Will show published posts, follower counts, follow button.

import { User, ImageOff } from "lucide-react";

interface Props {
  username: string;
}

export default function PublicProfilePage({ username }: Props) {
  return (
    <div className="min-h-screen px-4 py-24">
      {/* Profile header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
          {/* Avatar placeholder */}
          <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center flex-shrink-0">
            <User className="w-9 h-9 text-zinc-500" />
          </div>

          {/* Identity */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              @{username}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              AI artist on REX
            </p>

            {/* Social stats placeholder */}
            <div className="flex gap-6 mt-4">
              <Stat label="Posts" value="—" />
              <Stat label="Followers" value="—" />
              <Stat label="Following" value="—" />
            </div>
          </div>

          {/* Follow button placeholder */}
          <button
            disabled
            className="px-5 py-2 rounded-full border border-zinc-600 text-zinc-400 text-sm cursor-not-allowed opacity-60"
            title="Follow feature coming soon"
          >
            Follow
          </button>
        </div>

        {/* Posts gallery — Phase 2 */}
        <div className="border-t border-zinc-800 pt-10">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-6">
            Posts
          </h2>
          <EmptyGallery username={username} />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold text-white">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function EmptyGallery({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-600">
      <ImageOff className="w-10 h-10" />
      <p className="text-sm text-center">
        @{username} hasn&apos;t published any posts yet.
      </p>
      <p className="text-xs text-zinc-700 text-center max-w-xs">
        When they publish AI-generated images, they&apos;ll appear here.
      </p>
    </div>
  );
}
