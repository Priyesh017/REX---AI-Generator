"use client";

// components/shared/AppShell.tsx
// Shared wrapper for all authenticated app pages (studio, profile, generate, etc.)
// Provides: dark background, geometric background effect, navbar.
// The landing page does NOT use this — it has its own layout.

import Navbar from "@/components/navbar";
import HeroBackground from "@/components/ui/geometric-bg";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  /** Full-bleed pages (like admin) skip the gradient overlay */
  noOverlay?: boolean;
  className?: string;
}

export default function AppShell({ children, noOverlay = false, className }: AppShellProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#030303]">
      {/* Subtle geometric background — same as homepage */}
      <HeroBackground />

      {/* Gradient vignette overlay */}
      {!noOverlay && (
        <div className="fixed inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none z-[1]" />
      )}

      {/* Navbar */}
      <Navbar />

      {/* Page content */}
      <main className={cn("relative z-[2]", className)}>
        {children}
      </main>
    </div>
  );
}
