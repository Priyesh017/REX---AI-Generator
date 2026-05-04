"use client";

// components/studio/GeneratorPanel.tsx
// The image generation form — prompt input, generate button, result preview.
// Extracted from the old image-generator.tsx monolith into a proper domain component.
// Uses the shared studio API — no inline fetch.

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Sparkles, Download, RotateCcw } from "lucide-react";
import { studioApi } from "@/lib/api/studio.api";
import { ApiRequestError } from "@/lib/api/client";
import { saveImageUrlToCookie, getImageUrlFromCookie, clearImageUrlCookie } from "@/lib/imageCache";

export default function GeneratorPanel() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  // Restore cached image on mount
  useEffect(() => {
    const cached = getImageUrlFromCookie();
    if (cached) setImageUrl(cached);
  }, []);

  // Clear cache on sign-out
  useEffect(() => {
    if (!isSignedIn) {
      clearImageUrlCookie();
      setImageUrl(null);
    }
  }, [isSignedIn]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!isSignedIn) {
      toast.error("Please sign in to generate images", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    setIsLoading(true);
    setImageUrl(null);

    try {
      const api = studioApi(getToken);
      const result = await api.generate(prompt);

      const url = result.asset.image_url;
      saveImageUrlToCookie(url);
      setImageUrl(url);

      toast.success(
        `✅ Image generated! ${result.creditsRemaining} credit${result.creditsRemaining !== 1 ? "s" : ""} remaining`,
        { style: { borderRadius: "10px", background: "#333", color: "#fff" } }
      );
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong.";
      toast.error(msg, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImageUrl(null);
    clearImageUrlCookie();
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rex-generated.png";
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Image preview */}
      <div className="w-full max-w-sm aspect-square mx-auto">
        {isLoading ? (
          <div className="w-full h-full rounded-2xl bg-zinc-800/50 border border-zinc-700 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700/30 to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.8s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <Sparkles className="w-8 h-8 animate-pulse" />
                <span className="text-sm">Generating…</span>
              </div>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-700/50">
            <Image
              src={imageUrl}
              alt="Generated AI image"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-2xl border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-3 text-zinc-600">
            <Sparkles className="w-8 h-8" />
            <span className="text-sm text-center px-4">
              Your generated image will appear here
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      {!imageUrl ? (
        <form onSubmit={handleGenerate} className="w-full max-w-lg">
          <div className="flex bg-zinc-800/60 border border-zinc-700/60 backdrop-blur-sm rounded-full p-1 gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create…"
              className="flex-1 bg-transparent outline-none px-4 text-sm text-white placeholder:text-zinc-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!isSignedIn || isLoading || !prompt.trim()}
              className="flex items-center gap-2 bg-white text-zinc-900 font-medium text-sm px-5 py-2.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-zinc-100"
            >
              <Sparkles className="w-4 h-4" />
              {isSignedIn ? "Generate" : "Sign in"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm px-5 py-2.5 rounded-full transition"
          >
            <RotateCcw className="w-4 h-4" />
            Generate Another
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-white text-zinc-900 font-medium text-sm px-5 py-2.5 rounded-full hover:bg-zinc-100 transition"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      )}
    </div>
  );
}
