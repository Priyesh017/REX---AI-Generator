"use client";

// components/studio/GeneratorPanel.tsx
// Image generation form — prompt input, live result, post-generation actions.
// Uses the shared studio API client exclusively — no inline fetch().

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth, SignInButton } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  Sparkles,
  Download,
  RotateCcw,
  Copy,
  Send,
  Wand2,
} from "lucide-react";
import { studioApi, type DraftAsset } from "@/lib/api/studio.api";
import { ApiRequestError } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  saveImageUrlToCookie,
  getImageUrlFromCookie,
  clearImageUrlCookie,
} from "@/lib/imageCache";
import PublishModal from "./PublishModal";

export default function GeneratorPanel() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<DraftAsset | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const promptRef = useRef<HTMLInputElement>(null);

  // Restore the latest generated image from cookie on mount
  useEffect(() => {
    const cached = getImageUrlFromCookie();
    if (cached) {
      setResult({
        id: "cached",
        prompt: "",
        title: null,
        image_url: cached,
        generation_status: "completed",
        created_at: "",
      });
    }
  }, []);

  // Clear cached image when user signs out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      clearImageUrlCookie();
      setResult(null);
      setCreditsLeft(null);
    }
  }, [isSignedIn, isLoaded]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const api = studioApi(getToken);
      const genResult = await api.generate(trimmed);

      setCreditsLeft(genResult.creditsRemaining);
      queryClient.invalidateQueries({ queryKey: ["credits"] });

      if (genResult.asset.generation_status === "completed") {
        saveImageUrlToCookie(genResult.asset.image_url);
        setResult(genResult.asset);
        setIsLoading(false);
        toast.success(`Image saved to drafts`, { icon: "✨" });
      } else {
        // Poll for completion
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds (2s interval)
        const intervalId = setInterval(async () => {
          attempts++;
          try {
            const { asset } = await api.getDraft(genResult.asset.id);
            if (asset.generation_status === "completed") {
              clearInterval(intervalId);
              saveImageUrlToCookie(asset.image_url);
              setResult(asset);
              setIsLoading(false);
              toast.success(`Image generated and saved to drafts`, { icon: "✨" });
            } else if (asset.generation_status === "failed") {
              clearInterval(intervalId);
              setIsLoading(false);
              toast.error("Generation failed. Your credit has been refunded.");
              setResult(null);
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }

          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            setIsLoading(false);
            toast.error("Generation timed out. Please check your drafts later.");
            setResult(null);
          }
        }, 2000);
      }
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Generation failed. Please try again.";
      toast.error(msg);
      setResult(null);
      setIsLoading(false);
    } finally {
      promptRef.current?.focus();
    }
  };

  const handleClear = () => {
    setResult(null);
    clearImageUrlCookie();
    setPrompt("");
    promptRef.current?.focus();
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const res = await fetch(result.image_url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rex-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Download failed. Try right-clicking the image.");
    }
  };

  const handleCopyPrompt = () => {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt);
    toast.success("Prompt copied");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Image canvas */}
      <div className="w-full max-w-sm aspect-square mx-auto">
        {isLoading ? (
          <ShimmerCanvas />
        ) : result ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl shadow-black/50">
            <Image
              src={result.image_url}
              alt={result.prompt || "Generated AI image"}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <EmptyCanvas />
        )}
      </div>

      {/* Prompt input OR post-generation actions */}
      {!result ? (
        /* ── Prompt form ─────────────────────────────────── */
        <form onSubmit={handleGenerate} className="w-full max-w-lg">
          {/* Credit warning */}
          {creditsLeft !== null && creditsLeft <= 2 && (
            <p className="text-center text-xs text-orange-400 mb-3">
              {creditsLeft === 0
                ? "No credits left — "
                : `Only ${creditsLeft} credit${creditsLeft === 1 ? "" : "s"} left — `}
              <a href="/buy" className="underline hover:text-orange-300">
                buy more
              </a>
            </p>
          )}

          <div className="flex bg-zinc-900/70 border border-zinc-700/60 backdrop-blur-sm rounded-2xl p-1.5 gap-2 shadow-xl shadow-black/30 focus-within:border-zinc-600/80 transition-all duration-300">
            <input
              ref={promptRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isSignedIn
                  ? "Describe the image you want to create…"
                  : "Sign in to start generating…"
              }
              className="flex-1 bg-transparent outline-none px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              disabled={isLoading || !isSignedIn}
              maxLength={1000}
            />
            {isLoaded && !isSignedIn ? (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign in
                </button>
              </SignInButton>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !prompt.trim() || !isSignedIn}
                className="flex items-center gap-2 bg-white text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-zinc-100 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-pulse" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-center text-[11px] text-zinc-700 mt-2">
            Each generation uses 1 credit · Images are saved to your Drafts
          </p>
        </form>
      ) : (
        /* ── Post-generation actions ─────────────────────── */
        <div className="flex flex-col items-center gap-4 w-full max-w-lg">
          {/* Prompt display */}
          {result.prompt && (
            <div className="w-full flex items-start gap-2 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="flex-1 text-xs text-zinc-400 italic leading-relaxed line-clamp-2">
                &ldquo;{result.prompt}&rdquo;
              </p>
              <button
                onClick={handleCopyPrompt}
                className="shrink-0 text-zinc-600 hover:text-zinc-300 transition"
                title="Copy prompt"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm px-5 py-2.5 rounded-full transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Generate Another
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-zinc-100 active:scale-95 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 border border-indigo-700/50 text-indigo-400 text-sm px-5 py-2.5 rounded-full hover:bg-indigo-900/20 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              Publish
            </button>
          </div>

          <p className="text-[11px] text-zinc-700">
            Saved to My Drafts ·{" "}
            <a href="/studio" onClick={() => setResult(null)} className="hover:text-zinc-500 underline">
              View all drafts
            </a>
          </p>
        </div>
      )}

      {/* Publish Modal */}
      {result && (
        <PublishModal
          isOpen={isPublishModalOpen}
          draft={result}
          onClose={() => setIsPublishModalOpen(false)}
          onSuccess={() => {
            setResult(null);
            clearImageUrlCookie();
            toast.success("Image moved to your public feed");
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ShimmerCanvas() {
  return (
    <div className="w-full h-full rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden relative">
      <div className="absolute inset-0 bg-shimmer animate-shimmer" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <span className="text-sm font-medium">Generating your image…</span>
          <span className="text-xs text-zinc-700">This usually takes 10–30 seconds</span>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="w-full h-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center gap-3 text-zinc-700">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-zinc-600" />
      </div>
      <div className="text-center px-6">
        <p className="text-sm font-medium text-zinc-600">Your image will appear here</p>
        <p className="text-xs text-zinc-800 mt-1">Describe anything you can imagine</p>
      </div>
    </div>
  );
}
