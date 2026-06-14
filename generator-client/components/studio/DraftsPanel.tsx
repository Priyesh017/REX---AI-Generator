"use client";

// components/studio/DraftsPanel.tsx
// Private draft asset gallery — visual grid of the user's studio assets.
// Replaces the old table-based "prompt history" with a proper photo grid.

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Copy,
  Download,
  X,
  ImageOff,
  Loader2,
  MoreVertical,
  RefreshCcw,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { studioApi, type DraftAsset } from "@/lib/api/studio.api";
import { ApiRequestError } from "@/lib/api/client";
import PublishModal from "./PublishModal";

export default function DraftsPanel() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [lightboxAsset, setLightboxAsset] = useState<DraftAsset | null>(null);
  const [publishingAsset, setPublishingAsset] = useState<DraftAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error: fetchError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['drafts'],
    queryFn: async ({ pageParam }) => {
      const api = studioApi(getToken);
      return api.listDrafts(pageParam as string | undefined, 12);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.pagination.nextCursor ?? undefined;
    },
  });

  const assets = data?.pages.flatMap((page) => page.assets) || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const api = studioApi(getToken);
      return api.deleteDraft(id);
    },
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: (_, id) => {
      toast.success("Draft deleted");
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      if (lightboxAsset?.id === id) setLightboxAsset(null);
    },
    onError: () => {
      toast.error("Failed to delete draft");
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast.success("Prompt copied");
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rex-draft-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Download failed. Try right-clicking the image.");
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-zinc-900/50 border border-zinc-800/50 bg-shimmer animate-shimmer"
          />
        ))}
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
        <ImageOff className="w-10 h-10" />
        <p className="text-sm">
          {fetchError instanceof ApiRequestError ? fetchError.message : "Failed to load drafts"}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-xs border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-full transition"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
        <ImageOff className="w-10 h-10" />
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-500">No drafts yet</p>
          <p className="text-xs text-zinc-700 mt-1">
            Generated images will appear here after you create them.
          </p>
        </div>
      </div>
    );
  }

  // ── Draft grid ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
          {assets.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            >
              <DraftCard
                asset={asset}
                isDeleting={deletingId === asset.id}
                onPreview={() => setLightboxAsset(asset)}
                onPublish={() => setPublishingAsset(asset)}
                onDelete={() => handleDelete(asset.id)}
                onCopyPrompt={() => handleCopyPrompt(asset.prompt)}
                onDownload={() => handleDownload(asset.image_url)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Publish Modal */}
      {publishingAsset && (
        <PublishModal
          isOpen={!!publishingAsset}
          draft={publishingAsset}
          onClose={() => setPublishingAsset(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['drafts'] });
            setPublishingAsset(null);
          }}
        />
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 border border-zinc-700 text-zinc-400 hover:text-white text-sm px-6 py-2.5 rounded-full transition-all disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            {isFetchingNextPage ? "Loading…" : "Load More"}
          </button>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxAsset(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full"
            >
              {/* Close */}
              <button
                onClick={() => setLightboxAsset(null)}
                className="absolute -top-10 right-0 flex items-center gap-2 text-zinc-500 hover:text-white text-xs transition"
              >
                Close <X className="w-4 h-4" />
              </button>

              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-square">
                <Image
                  src={lightboxAsset.image_url}
                  alt={lightboxAsset.title ?? lightboxAsset.prompt}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              {/* Prompt + actions bar */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-zinc-500 italic leading-relaxed line-clamp-2 flex-1">
                  {lightboxAsset.prompt
                    ? `"${lightboxAsset.prompt}"`
                    : "No prompt available"}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyPrompt(lightboxAsset.prompt)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition"
                    title="Copy prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(
                        lightboxAsset.image_url,
                      )
                    }
                    className="p-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
  isDeleting: boolean;
  onPreview: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onCopyPrompt: () => void;
  onDownload: () => void;
}

function DraftCard({
  asset,
  isDeleting,
  onPreview,
  onPublish,
  onDelete,
  onCopyPrompt,
  onDownload,
}: DraftCardProps) {
  return (
    <div
      className={`group relative aspect-square rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-900 hover:border-zinc-700 transition-all duration-200 ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* Thumbnail */}
      {asset.generation_status === 'pending' || !asset.image_url ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-[10px] text-zinc-600 font-medium">Generating...</span>
        </div>
      ) : asset.generation_status === 'failed' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-red-500/70 gap-2 p-3">
          <ImageOff className="w-6 h-6 text-red-500/50" />
          <span className="text-[10px] text-zinc-600 text-center font-medium">Generation Failed</span>
        </div>
      ) : (
        <Image
          src={asset.image_url}
          alt={asset.title ?? asset.prompt}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.03]"
          onClick={onPreview}
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 pointer-events-none group-hover:pointer-events-auto">
        {/* Top — date + context menu */}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80 transition backdrop-blur-sm">
                <MoreVertical className="w-3.5 h-3.5 text-zinc-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-zinc-900/95 border-zinc-700/80 backdrop-blur-xl text-sm rounded-xl shadow-xl"
            >
              {asset.generation_status === 'completed' && (
                <>
                  <DropdownMenuItem
                    onClick={onPublish}
                    className="gap-2 text-indigo-400 focus:text-indigo-300 focus:bg-indigo-900/30 rounded-lg cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-700/60 my-1" />
                </>
              )}
              <DropdownMenuItem
                onClick={onCopyPrompt}
                className="gap-2 text-zinc-300 focus:text-white focus:bg-zinc-800 rounded-lg cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Prompt
              </DropdownMenuItem>
              {asset.generation_status === 'completed' && (
                <DropdownMenuItem
                  onClick={onDownload}
                  className="gap-2 text-zinc-300 focus:text-white focus:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-zinc-700/60 my-1" />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-900/30 rounded-lg cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom — prompt preview */}
        <div 
          className={asset.generation_status === 'completed' ? "cursor-pointer" : ""} 
          onClick={asset.generation_status === 'completed' ? onPreview : undefined}
        >
          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
            {asset.prompt || asset.title || "No prompt"}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">
            {new Date(asset.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
