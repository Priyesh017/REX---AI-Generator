"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { motion, Variants, AnimatePresence } from "framer-motion";

type ImagePrompt = {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.5 + i * 0.2,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

export default function PromptHistoryTablePage() {
  const [data, setData] = useState<ImagePrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [pagination, setPagination] = useState({ page: 1, hasNext: false });

  const { getToken } = useAuth();

  const fetchHistory = useCallback(async (pageToFetch: number, isLoadMore: boolean = false) => {
    if (!isLoadMore) setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history?page=${pageToFetch}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (isLoadMore) {
        setData((prev) => [...prev, ...(json.images || [])]);
      } else {
        setData(json.images || []);
      }
      setPagination({
        page: json.pagination?.page || pageToFetch,
        hasNext: json.pagination?.hasNext || false
      });
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleLoadMore = () => {
    fetchHistory(pagination.page + 1, true);
  };

  const handleCopy = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied!", {
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/history/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setData((prev) => prev.filter((img) => img.id !== id));
        toast.success("Deleted successfully", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting prompt", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!loading && data.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-400 mt-12 min-h-screen">
        No prompt history found.
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 min-h-screen"
    >
      {!loading ? (
        <div className="max-w-5xl md:mx-auto border border-zinc-800 rounded-lg">
          {/* Grid header */}
          <div className="grid grid-cols-12 bg-zinc-900 text-center text-sm font-semibold text-zinc-400 p-1 md:px-4 mdpy-2 rounded-t-lg">
            <div className="col-span-1">SN</div>
            <div className="col-span-2">Image</div>
            <div className="col-span-5">Prompt</div>
            <div className="col-span-3">Created At</div>
            {/* <div className="col-span-1">Actions</div> */}
          </div>

          {/* Grid rows */}
          <div className="divide-y divide-zinc-800 rounded-b-lg overflow-hidden">
            {data.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-12 place-items-center p-1 md:px-4 md:py-3 hover:bg-zinc-700/30 hover:backdrop-blur-lg transition text-sm text-zinc-200"
              >
                <div className="col-span-1">{idx + 1}</div>
                <div className="col-span-2">
                  <Image
                    src={item.image_url}
                    alt="Generated"
                    width={50}
                    height={50}
                    className="w-16 h-16 rounded object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => setSelectedImage(item.image_url)}
                  />
                </div>
                <div className="col-span-5 text-muted/80 line-clamp-2 overflow-hidden md:truncate px-2">
                  {item.prompt}
                </div>
                <div className="col-span-3 text-muted-foreground text-sm">
                  {new Date(item.created_at).toLocaleString()}
                </div>
                <div className="col-span-1 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded hover:bg-zinc-800 transition">
                        <MoreVertical className="w-5 h-5 text-zinc-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 bg-zinc-800/30 backdrop-blur-lg border-zinc-800"
                    >
                      <DropdownMenuLabel className="text-muted/90 tracking-wider">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="h-[0.5px] bg-zinc-800" />
                      <DropdownMenuItem
                        className="text-muted/70 focus:text-muted focus:bg-zinc-800"
                        onClick={() => handleCopy(item.prompt)}
                      >
                        Copy Prompt
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-muted/70 focus:text-muted focus:bg-zinc-800"
                        onClick={() =>
                          downloadImage(item.image_url, "generated-image.png")
                        }
                      >
                        Download Image
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 focus:text-muted focus:bg-red-600/70"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {pagination.hasNext && (
            <div className="flex justify-center mt-6 mb-10">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-zinc-900 border border-zinc-800 text-muted px-8 py-2 rounded-full hover:bg-zinc-800 transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl md:mx-auto border border-zinc-800 rounded-lg animate-pulse">
          {/* Grid header */}
          <div className="grid grid-cols-12 bg-zinc-900 text-center text-sm font-semibold text-zinc-400 p-1 md:px-4 mdpy-2 rounded-t-lg">
            <div className="col-span-1">SN</div>
            <div className="col-span-2">Image</div>
            <div className="col-span-5">Prompt</div>
            <div className="col-span-3">Created At</div>
          </div>

          {/* Skeleton rows */}
          <div className="divide-y divide-zinc-800 rounded-b-lg overflow-hidden">
            {/* {[...Array(1)].map((_, idx) => ( */}
            <div
              // key={idx}
              className="grid grid-cols-12 place-items-center p-1 md:px-4 md:py-3 text-sm"
            >
              <div className="col-span-1 h-4 w-4 bg-zinc-700 rounded" />
              <div className="col-span-2">
                <div className="w-16 h-16 bg-zinc-700 rounded" />
              </div>
              <div className="col-span-5 w-full px-2">
                <div className="h-3 w-full bg-zinc-700 rounded mb-1" />
                <div className="h-3 w-3/4 bg-zinc-700 rounded" />
              </div>
              <div className="col-span-3 h-4 w-24 bg-zinc-700 rounded" />
              <div className="col-span-1 h-4 w-4 bg-zinc-700 rounded-full" />
            </div>
            {/* ))} */}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="Fullscreen AI Generated"
                width={1200}
                height={800}
                className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
              
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 -right-12 text-white/70 hover:text-white flex items-center gap-2 transition"
              >
                <span className="text-sm font-medium">Close</span>
                <div className="bg-white/10 p-2 rounded-full border border-white/10">
                  <X className="w-5 h-5" />
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
