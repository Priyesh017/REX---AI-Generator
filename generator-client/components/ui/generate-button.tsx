"use client";

import { motion, useAnimationControls } from "framer-motion";
import { WandSparkles } from "lucide-react";
import { useEffect } from "react";

interface BreathingNeonButtonProps {
  onClick?: () => void;
}

export default function BreathingNeonButton({
  onClick,
}: BreathingNeonButtonProps) {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      },
    });
  }, [controls]);

  return (
    <motion.button
      onClick={onClick}
      className="relative px-6 py-3 rounded-xl text-white font-semibold 
             bg-gradient-to-br from-indigo-500/[0.15] via-black/5 to-black/5
             backdrop-blur-md border border-white/10 shadow-xl transition-all duration-300 ease-in-out
             before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:blur-2xl 
             before:bg-indigo-400/50 before:opacity-30 before:animate-pulse"
      animate={controls}
      onHoverStart={() => controls.stop()}
      onHoverEnd={() =>
        controls.start({
          scale: [1, 1.05, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          },
        })
      }
      whileHover={{
        scale: 1.08,
        boxShadow: "0 0 25px rgba(99, 102, 241, 0.3)", // Indigo glow
      }}
    >
      <span className="relative z-10 text-lg font-medium flex justify-center items-center gap-1">
        Generate <WandSparkles size={20} />
      </span>
    </motion.button>
  );
}
