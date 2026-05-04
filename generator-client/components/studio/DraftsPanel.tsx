"use client";

// components/studio/DraftsPanel.tsx
// Private draft asset gallery — the evolution of "Prompt History".
// Displays the user's generated images as a visual grid, not a table.
// Uses the shared studio API — no inline fetch.

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Copy, Download, X, ImageOff, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { studioApi, type DraftAsset } from "@/lib/api/studio.api";
import { ApiRequestError } from "@/lib/api/client";

export default function DraftsPanel() {
  const { getToken } = useAuth();
  const [assets, setAssets] = useState<DraftAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchDrafts = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const api = studioApi(getToken);
        const result = await api.listDrafts(pageNum, 12);

        setAssets((prev) =>
          append ? [...prev, ...result.assets] : result.assets
        );
        setHasNext(result.meta.pagination.hasNext);
        setPage(pageNum);
      } catch (err) {
        const msg = err instanceof ApiRequestError ? err.message : "Failed to load drafts";
        toast.error(msg, { style: { borderRadius: "10px", background: "#333", color: "#fff" } });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    fetchDrafts(1);
  }, [fetchDrafts]);

  const handleDelete = async (id: string) => {
    try {
      const api = studioApi(getToken);
      await api.deleteDraft(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Draft deleted", { style: { borderRadius: "10px", background: "#333", color: "#fff" } });
    } catch {
      toast.error("Failed to delete draft");
    }
  };

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast.success("Prompt copied!", { style: { borderRadius: "10px", background: "#333", color: "#fff" } });
  };

  const handleDownload = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rex-draft.png";
    link.click();
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!loading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-500">
        <ImageOff className="w-12 h-12" />
        <p className="text-sm">No drafts yet. Generate your first image!</p>
      </div>
    );
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <DraftCard
            key={asset.id}
            asset={asset}
            onPreview={() => setLightboxUrl(asset.image_url)}
            onDelete={() => handleDelete(asset.id)}
            onCopyPrompt={() => handleCopyPrompt(asset.prompt)}
            onDownload={() => handleDownload(asset.image_url)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasNext && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchDrafts(page + 1, true)}
            disabled={loadingMore}
            className="flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:text-white text-sm px-6 py-2.5 rounded-full transition disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full"
            >
              <Image
                src={lightboxUrl}
                alt="Draft preview"
                width={1200}
                height={1200}
                unoptimized
                className="w-full max-h-[80vh] object-contain rounded-xl border border-white/10"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute -top-10 right-0 flex items-center gap-2 text-white/70 hover:text-white text-sm transition"
              >
                Close <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── DraftCard ─────────────────────────────────────────────────────────────────

interface DraftCardProps {
  asset: DraftAsset;
  onPreview: () => void;
  onDelete: () => void;
  onCopyPrompt: () => void;
  onDownload: () => void;
}

function DraftCard({ asset, onPreview, onDelete, onCopyPrompt, onDownload }: DraftCardProps) {
  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-all duration-200">
      {/* Image */}
      <Image
        src={asset.image_url}
        alt={asset.title ?? asset.prompt}
        fill
        unoptimized
        className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
        onClick={onPreview}
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
        {/* Prompt preview */}
        <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
          {asset.prompt}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {new Date(asset.created_at).toLocaleDateString()}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 transition">
                <MoreVertical className="w-4 h-4 text-zinc-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-zinc-900 border-zinc-700 text-sm"
            >
              <DropdownMenuItem onClick={onCopyPrompt} className="gap-2 text-zinc-300 focus:text-white focus:bg-zinc-800">
                <Copy className="w-3.5 h-3.5" /> Copy Prompt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload} className="gap-2 text-zinc-300 focus:text-white focus:bg-zinc-800">
                <Download className="w-3.5 h-3.5" /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-900/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
