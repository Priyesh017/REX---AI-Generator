"use client";

// app/generate/page.tsx
// Legacy /generate route — now an alias for /studio.
// Redirects immediately to preserve all existing inbound links and bookmarks.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function GenerateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/studio");
  }, [router]);

  // Brief loading state during redirect
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-zinc-500">
        <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
        <p className="text-sm">Redirecting to Studio…</p>
      </div>
    </div>
  );
}
