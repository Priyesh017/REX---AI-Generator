"use client";

// components/studio/StudioPage.tsx
// Studio page — the primary creative workspace.
// Two tabs: Generate (prompt → image) and Drafts (private asset gallery).
// This refactors the old generate/page.tsx into a proper domain component.

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Wand2, FolderOpen } from "lucide-react";
import GeneratorPanel from "./GeneratorPanel";
import DraftsPanel from "./DraftsPanel";

type Tab = "generate" | "drafts";

export default function StudioPage() {
  const { isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="min-h-screen flex flex-col px-4 md:px-8 py-24"
    >
      {/* Page header */}
      <div className="max-w-5xl mx-auto w-full mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Studio</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Generate AI images from your prompts and manage your draft collection.
        </p>
      </div>

      {/* Tab navigation */}
      {isSignedIn && (
        <div className="max-w-5xl mx-auto w-full mb-6">
          <div className="inline-flex bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-1 gap-1">
            <TabButton
              active={activeTab === "generate"}
              onClick={() => setActiveTab("generate")}
              icon={<Wand2 className="w-4 h-4" />}
              label="Generate"
            />
            <TabButton
              active={activeTab === "drafts"}
              onClick={() => setActiveTab("drafts")}
              icon={<FolderOpen className="w-4 h-4" />}
              label="My Drafts"
            />
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="max-w-5xl mx-auto w-full flex-1">
        {activeTab === "generate" && <GeneratorPanel />}
        {activeTab === "drafts" && isSignedIn && <DraftsPanel />}
      </div>
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${
          active
            ? "bg-zinc-700 text-white shadow-sm"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
