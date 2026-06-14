"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  title: string;
};

const PRESETS = [
  "Spam or misleading content",
  "Inappropriate content / NSFW",
  "Harassment or hate speech",
  "Intellectual property violation",
  "Other (please describe below)"
];

export default function ReportModal({ isOpen, onClose, onSubmit, title }: Props) {
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESC key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = selectedPreset === "Other (please describe below)" || !selectedPreset
      ? customReason.trim()
      : selectedPreset + (customReason ? `: ${customReason.trim()}` : "");

    if (!reason.trim()) {
      toast.error("Please provide a reason for the report.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason);
      toast.success("Thank you for your report. Our moderators will review this content.");
      setSelectedPreset("");
      setCustomReason("");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit report. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div
              className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gradient highlight */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Why are you reporting this content?
                  </label>
                  <div className="space-y-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSelectedPreset(preset)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                          selectedPreset === preset
                            ? "bg-rose-500/10 border-rose-500/50 text-rose-400 font-medium"
                            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Additional details
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Provide more context (optional)..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-rose-500 transition min-h-[80px] resize-none"
                    maxLength={500}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-sm transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
