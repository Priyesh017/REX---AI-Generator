"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  saveImageUrlToCookie,
  getImageUrlFromCookie,
  clearImageUrlCookie,
} from "@/lib/imageCache";
import { motion, Variants } from "framer-motion";

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

const ImageGenerator = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const { getToken, isSignedIn } = useAuth();

  // 1️⃣ Load cached image on initial mount
  useEffect(() => {
    const cachedImage = getImageUrlFromCookie();
    if (cachedImage) {
      setImageUrl(cachedImage);
      setIsImageLoaded(true);
    }
  }, []);

  // 2️⃣ Clear cookie when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      clearImageUrlCookie();
    }
  }, [isSignedIn]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 🔐 Check if the user is signed in
    if (!isSignedIn) {
      toast.error("Please sign in to generate images", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    setIsLoading(true);
    setImageUrl("");
    setIsImageLoaded(false);

    try {
      const token = await getToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();

      if (res.ok) {
        const url = data.image.image_url;
        saveImageUrlToCookie(url);
        setImageUrl(url);
        setIsImageLoaded(true);
        toast.success("✅ Image Successfully Generated", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        throw new Error(data.error || "Image generation failed.");
      }
    } catch (err) {
      console.error("❌ Generation error:", err);
      toast.error(
        err instanceof Error ? err.message : "Something went wrong.",
        {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        }
      );
    } finally {
      setIsLoading(false);
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

  const handleClear = () => {
    setIsImageLoaded(false);
    setImageUrl("");
    clearImageUrlCookie();
  };

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 min-h-scren text-muted"
    >
      <form onSubmit={handleGenerate} className="w-full">
        <div className="max-w-sm h-72 mx-auto mt-10 overflow-hidden relative">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6 animate-fade-in">
              <div className="relative w-full h-64 rounded-xl bg-zinc-800/30 border border-zinc-700 shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700/30 to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.8s_linear_infinite]" />
              </div>
              <div className="w-2/3 h-4 rounded bg-gradient-to-r from-zinc-700 via-zinc-600/40 to-zinc-700 bg-[length:200%_100%] animate-[shimmer_1.8s_linear_infinite]" />
              <div className="w-1/2 h-4 rounded bg-gradient-to-r from-zinc-700 via-zinc-600/40 to-zinc-700 bg-[length:200%_100%] animate-[shimmer_1.8s_linear_infinite]" />
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt="Generated"
              width={1200}
              height={1200}
              unoptimized
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center border border-border/20 rounded-xl text-muted-foreground">
              Generated image will appear here
            </div>
          )}
        </div>

        {!isImageLoaded ? (
          <div className="w-full flex mx-auto max-w-lg bg-neutral-500/50 backdrop-blur-lg text-muted text-sm p-0.5 mt-10 rounded-full">
            <input
              type="text"
              placeholder="Describe what you want to generate"
              className="flex-1 bg-transparent outline-none ml-6 mr-2 max-sm:w-20 text-muted"
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
            <button
              type="submit"
              className="bg-zinc-900 px-10 sm:px-16 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isSignedIn || isLoading}
            >
              {isSignedIn ? "Generate" : "Sign in to Generate"}
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center text-muted text-sm p-0.5 mt-10 rounded-full">
            <button
              type="button"
              className="bg-transparent backdrop-blur-2xl border border-zinc-900 text-muted px-8 py-3 rounded-full cursor-pointer"
              onClick={handleClear}
            >
              Generate Another
            </button>
            <button
              onClick={() => downloadImage(imageUrl, "generated-image.png")}
              className="bg-zinc-900 px-10 py-3 rounded-full cursor-pointer"
            >
              Download Image
            </button>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default ImageGenerator;
