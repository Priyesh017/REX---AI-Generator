"use client";

import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, Globe } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { postApi } from "@/lib/api/post.api";
import { type DraftAsset } from "@/lib/api/studio.api";

interface PublishModalProps {
  draft: DraftAsset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const publishSchema = z.object({
  title: z.string().max(100, "Title must be 100 characters or less").optional(),
  caption: z.string().max(500, "Caption must be 500 characters or less").optional(),
});

type PublishFormData = z.infer<typeof publishSchema>;

export default function PublishModal({ draft, isOpen, onClose, onSuccess }: PublishModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PublishFormData>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      title: draft.title || "",
      caption: "",
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (data: PublishFormData) => {
      const api = postApi(getToken);
      return api.publish(draft.id, {
        title: data.title?.trim() || undefined,
        caption: data.caption?.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Published to your profile!");
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      onSuccess();
      onClose();
      reset();
    },
    onError: () => {
      toast.error("Failed to publish post.");
    }
  });

  const onSubmit = (data: PublishFormData) => {
    publishMutation.mutate(data);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Preview Side */}
              <div className="w-full md:w-1/2 aspect-square relative bg-black">
                <Image
                  src={draft.image_url}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Form Side */}
              <form onSubmit={handleSubmit(onSubmit)} className="w-full md:w-1/2 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-lg font-bold text-white">Publish Post</h2>
                  </div>
                  <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("title")}
                      placeholder="Give it a name..."
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition"
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
                      Caption
                    </label>
                    <textarea
                      {...register("caption")}
                      placeholder="Tell the story behind this generation..."
                      rows={4}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition resize-none"
                    />
                    {errors.caption && <p className="text-red-400 text-xs mt-1">{errors.caption.message}</p>}
                  </div>

                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5" />
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        This will make the image public on your profile and in the discovery feed.
                        The original prompt will be visible to other creators.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={publishMutation.isPending}
                    className="w-full bg-white text-zinc-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-100 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {publishMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {publishMutation.isPending ? "Publishing..." : "Publish to REX"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
