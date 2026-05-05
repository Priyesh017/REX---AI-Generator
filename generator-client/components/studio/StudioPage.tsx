"use client";

// components/studio/StudioPage.tsx
// Primary creative workspace — two tabs: Generate + My Drafts.

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Wand2, FolderOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import GeneratorPanel from "./GeneratorPanel";
import DraftsPanel from "./DraftsPanel";

type Tab = "generate" | "drafts";

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function StudioPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  return (
    <div className="min-h-screen flex flex-col px-4 md:px-8 pt-28 pb-16">
      {/* Page header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto w-full mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-rose-500/20 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Studio</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-11">
          Generate AI images from your prompts and manage your private draft collection.
        </p>
      </motion.div>

      {/* Tab navigation — only when signed in */}
      {isLoaded && isSignedIn && (
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto w-full mb-8"
        >
          <div className="inline-flex bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-1 gap-1">
            <TabButton
              active={activeTab === "generate"}
              onClick={() => setActiveTab("generate")}
              icon={<Wand2 className="w-3.5 h-3.5" />}
              label="Generate"
            />
            <TabButton
              active={activeTab === "drafts"}
              onClick={() => setActiveTab("drafts")}
              icon={<FolderOpen className="w-3.5 h-3.5" />}
              label="My Drafts"
            />
          </div>
        </motion.div>
      )}

      {/* Tab content */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto w-full flex-1"
      >
        {/* Always show GeneratorPanel — auth gate is inside it */}
        {(activeTab === "generate" || !isSignedIn) && <GeneratorPanel />}
        {activeTab === "drafts" && isLoaded && isSignedIn && <DraftsPanel />}

        {/* Unauthenticated call-to-action below generator */}
        {isLoaded && !isSignedIn && (
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-4 px-8 py-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <p className="text-sm text-zinc-400">
                Sign in to save your generated images and access your draft collection.
              </p>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-200">
                  <Sparkles className="w-4 h-4" />
                  Get Started — Free
                </button>
              </SignInButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200",
        active
          ? "bg-zinc-700/80 text-white shadow-sm"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
