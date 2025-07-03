// components/ImagePromptCard.tsx
"use client";

import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ImagePromptCardProps {
  imageUrl: string;
  prompt: string;
}

export const ImagePromptCard: React.FC<ImagePromptCardProps> = ({
  imageUrl,
  prompt,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="bg-zinc-900/20 backdrop-blur-lg rounded-2xl p-4 w-full max-w-xs hover:shadow-xl border border-zinc-700/50"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt="AI Generated Sample"
          width={1200}
          height={1200}
          className="rounded-lg w-full h-60 object-cover"
        />
      </div>

      <div className="mt-4 flex justify-between items-center">
        <h3 className="text-muted font-semibold text-sm">Prompt</h3>
        <button
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white transition"
        >
          <Copy size={18} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-4">
        {prompt}
      </p>

      {copied && (
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-green-400 text-xs mt-1"
        >
          Copied to clipboard!
        </motion.span>
      )}
    </motion.div>
  );
};
