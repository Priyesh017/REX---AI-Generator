"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import BreathingNeonButton from "../ui/generate-button";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

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

const HeroContent = () => {
  const router = useRouter();

  return (
    <div className="relative z-10 container mx-auto px-4 md:px-6 py-24 md:py-32 h-screen">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
        >
          <span className="text-sm text-white/60 tracking-wide">
            Generative AI Tool ⭐
          </span>
        </motion.div>

        <motion.div
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-normal">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              Rex
            </span>
            <br />
            <span
              className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300",
                pacifico.className
              )}
            >
              The Generator
            </span>
          </h1>
        </motion.div>

        <motion.div
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
            Unleash your creativity with AI. Turn your imagination into visual
            art in seconds - just type, watch the match happen.
          </p>
        </motion.div>
        <BreathingNeonButton onClick={() => router.push("/generate")} />
      </div>
    </div>
  );
};

export default HeroContent;
