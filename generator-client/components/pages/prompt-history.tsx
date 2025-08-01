"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

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

  const { getToken } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        setData(json.images || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getToken]);

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
                    className="w-16 h-16 rounded object-cover"
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
    </motion.div>
  );
}
